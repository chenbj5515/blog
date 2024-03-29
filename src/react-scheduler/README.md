# React scheduler学习笔记

最近从社区内收获到一篇非常好的[文章](https://zhuanlan.zhihu.com/p/446006183)，作者用一个小demo来示范React是如何使用scheduler这个包来进行任务调度。

为什么说文章好呢？首先scheduler这个包是React调度中非常重要的一环，必须了解这个包才能充分理解React的调度。

scheduler这个包很小不难读，但是如果直接读scheduler，空中楼阁，大致理解很容易，但是没有一个实例跑源码的话就无法验证理解并纠正错误理解，很容易理解不到位甚至有偏差。

而通过react跑scheduler，就多了一层要理解的东西，如果不是对React其他部分源码非常熟悉的话，可能导致效率不高。

而这篇文章提供了一个模仿react使用scheduler的小demo，我们就找到了很好的角度，可以高效地学习了。

这样跑demo和调试源码:
1. node_modules下找到scheduler包，其下的scheduler.development.js就是scheduler源码
2. demo代码或源码里log/debugger后重新npm run dev即可用最新代码运行

本文的核心是探究sheduler是如何进行**时间切片、如何中断和恢复任务、高优打断低优以及避免饥饿问题**。

## 走一遍更新流程

所谓调度，简单理解就是面对一个任务，不再简单粗暴地直接一次性同步执行完毕，而是提供一个方法，让某次更新任务以合理的方式执行完。那么我们以最简单的更新流程为例过一遍源码，然后再理解并总结。

一切的源头是点击一次同步更新的按钮，往workList里压入了一个work，然后执行schedule来调度。

### schedule
   1. 取出待执行任务中优先级最高的work，当前就一个work

   2. 把执行work的perform方法bind上work作为一个callback

   3. 把callback传入scheduleCallback，对当前的同步任务进行调度
### scheduleCallback
   这里可以拿到当前的优先级和表示执行任务的回调函数。
  
    1. 首先会记录当前时间为startTime
    2. 根据优先级设置timeout，越低优先级，timeout就越大
    3. 根据startTime和timeout计算过期时间
    4. 生产一个新的task对象：
        var newTask = {
            id: taskIdCounter++,
            callback: callback,
            priorityLevel: priorityLevel,
            startTime: startTime,
            expirationTime: expirationTime,
            sortIndex: -1
         };
    5. 将task压入taskQueue这个全局变量。
    6. 进入requestHostCallback

### requestHostCallback

   1. 将flushWork设置为全局字段scheduledHostCallback的值
    
   2. 执行schedulePerformWorkUntilDeadline，这个东西很简单就是用message channel开启一个宏任务。这个宏任务正常情况下会在4ms左右执行我们注册好的回调也就是performWorkUntilDeadline
    
### performWorkUntilDeadline
    
   1.执行scheduledHostCallback，也就是在3-1中提到的flushWork回调函数
   
    
   2.flushWork没干什么重要的事情，暂时当成就是调用workLoop
    
### workLoop
   1. 从taskQueue中取出一个最高优的task执行。
   
   2. task上有callback，callback就是1-3中用scheduleCallback方法传入的perform方法
### perform
   判断是否是同步优先级，是的话就直接不可中断地将整个任务执行完毕。这个例子中显然是，所以完成了全部的节点渲染， 结束。

## 复盘sheudle的实现
我们大致看了下最简单的同步流程，但是我们还有许多疑问，比如我听说React会把任务划分为5ms一个的时间切片，是如何做到的？调度的话高优任务肯定是要能打断低优任务的啊，如果做到的呢？以及如何避免低优任务一直被打断一直得不到执行的饥饿问题呢？我们将在这一节一一探究。

### 基本要素——任务和执行任务

我们讨论的东西最基本的要素就是两个，任务和执行任务。

其中任务的实体的源头是一个***work***：

```tsx
// work的实体，有优先级属性和count属性是工作内容的抽象，比如100代表要渲染100个节点
{
  priority,
  count: 100
}
```

执行任务的实体就是perform函数，perfrom函数会消费一个work，进行dom操作渲染出100个节点。

### 为什么不可以直接用perform完成工作？

然而我们点击按钮，要执行一个渲染100个节点的work时，并不会直接调用perform函数传入当前work，而是把work push进workList，然后调用shedule函数，来让任务以合理的方式被执行。

那么到底直接执行任务的话React认为哪里不合理呢？React认为他不该一次性把所有任务都干完，因为这个任务可能是耗时的（比如用户发起的更新大量节点的任务）

1. 如果在执行过程中来了个更高优的任务的话，他应该中断这个耗时的低优任务而去执行更高优的任务。
2. 即使没有更高优的任务要做，但面对一个非紧急的任务，也不该耗费大量时间一次性地执行完毕，而是应该进行时间切片，对单个非紧急耗时任务进行切割，每个loop执行一部分，留出一部分时间让浏览器进行一些其他工作而非完全阻塞。

### shedule是如何做到时间切片和高优打断低优？
#### 回顾下shedule方法做了什么

    1. perform方法bind上这个最高优的任务变成一个callback
    2. 把callback加上startTime和expiredTime得到一个task，开始时间就是c步骤开始时设置，expiredTime是根据优先级在startTime的基础上增加一个延时得出
    3. 将c中的task压入taskQueue
    4. 利用message channel发起宏任务，将callback的执行延迟到大约4ms后开始
#### 在perform中的中断

   听到这里，似乎就是延迟执行了下，如何实现时间切片和高优打断呢？

   实际上，React会把***work***设计成可打断可恢复的模式(demo中的work用count计数这种形式简单地模拟了可打断可恢复)，所以在perform中每完成一个fiber的任务后都会检查执行了多久了，如果超过了5ms，那么就会中断任务：
    
    
    // shouldYield是检查执行了多久的方法
    // needSync为true时说明这个任务是紧急的，那React就不会进行时间切片啦
    while ((needSync || !shouldYield()) && work.count) {
        work.count--;
        // 执行具体的工作
        insertItem(work.priority + "");
    }
    
    
#### 中断的恢复
好了，中断了while循环，work是不再执行了，但是work可恢复只是work本身被设计成可恢复，但恢复这个动作是sheduler来做的。
    
   从代码上来讲，我们只需要再次schedule即可。
    
   再次schedule时会取当前最高优的任务作为这次的优先级，然后会比较这次的优先级和上次任务的优先级。

##### 同一优先级的中断恢复
    
   如果是同一个优先级，说明不需要安排新的任务，还是继续当前任务。（P.S.不用担心上次做完了但是识别到时同一个优先级这次就错误地跳过了，因为上一个做完了会把上次的优先级设置为空闲优先级）
        
   这时就没有新的callback，那么perform函数就会返回一个绑定了剩余work的perform方法给workLoop方法。而workLoop方法中的while循环识别到接下来还有任务就会继续执行：
        
   注意，如果是同一优先级就直接这样继续执行的话，那么其实代码还是同步的，这样是有问题的，首先这样就没有让出线程给浏览器响应，其次因为是同步的，所以执行过程中高优任务永远也无法加入，那么打断低优任务的执行还有什么意义呢？
        
所以workLoop中会不仅仅在这种情况下会继续执行callback也就是perform方法，而且还会在执行前检查任务的执行时间，看看是否已经执行超时，是的话就取消任务，重新schedulePerformWorkUntilDeadline，让出线程，并在在4ms左右后再次回归执行workLoop。
        
这里我们其实就发现了，我们会在**两个地方检查是否执行超时**：
        
    1. perform方法消费work时会检查，work的消费是否超时了
    2. workLoop这边也会检查一个task也就是一个perform的执行时间是否超时，是的话就不再执行，而是在重新schedulePerformWorkUntilDeadline，并重置执行时间。
##### 高优打断低优的中断恢复

如果我们执行到了一半，这个demo来说就是一个低优work一共count是100个，完成了20后点击高优任务按钮，增加了一个高优任务。这时的底层逻辑是这样的：
        
    1. 还是切片每5ms就会中断一次，重新执行schedule方法，取到了更高优的work，这时schedule发现优先级不一样了，就会通过scheduleCallback交给scheduler一个新的高优callback.
    2. scheduler会将callback封装成一个task然后压入taskQueue
    3. 最终在workLoop方法中取出来这个高优task，然后执行。
  
 至此就实现了高优打断低优，按照这个模型剩下的事也好理解了：
        
 每过5ms都会检查是否有更高优任务，有就执行那个，一个work执行完毕了也会和5ms打断一样调用shedule，取出剩余任务列表中最高优的继续执行。

### 饥饿问题
虽然高优打断低优是合理的，但是这种情况就会出现饥饿问题了。因为即使是一个低优任务，也不该一直被打断，一直得不到执行，因为低优任务一旦长时间得不到执行可能会造成比高优任务没有被快速响应更大的问题。

所以一个设计良好的系统应该避免这种情况的，sheduler通过给任务设定过期时间来解决这个问题，打断是通过shouleYieldToHost这个方法判定task的执行时间来打断的，具体逻辑在workLoop方法中。所以避免饥饿问题的关键就在这里了，我们只需要在yield前判断是否已经过期，**如果已经过期，那就不再判断执行了多久，不再能被打断，直接同步执行完**。

当然，这也得再次轮到低优任务，如果出现极端情况，高优任务一直被更高优任务打断，一直轮不到第一个被打断的低优任务的话，这个过期时间就没用了，不过考虑浏览器执行任务的效率与任务发起的频率我猜想这种情况几乎不可能发生。

## sheduler的总结

### 总结下sheduler包做的事情

1. 注册部分：接收的输入就是***callback***+优先级，会把callback封装成***task***，并一开始就根据优先级设置好expiredTime，然后就加入***taskQueue***
2. 消费部分：取出最高优的任务，执行5ms，然后留出4ms左右时间给浏览器执行其他任务，这时可能会压入更高优的任务。如果识别到有更高优的任务，就先搁置上一个未完成的低优任务而去执行最高优的任务，也是执行5ms，也会4ms左右时间给浏览器执行其他任务，也可能被其他更高优打断（不过再打断其实是一回事了，我们推演没有其他任务了的情况）。没有其他任务了，执行完高优任务就会回到低优任务，这里会检查低优任务是否已经超时，如果没有则还是5ms，4ms这样，如果已经超时，则不再只执行5ms，而是会直接同步执行完毕。

### 其他重点内容
1. 还想再回顾的一个重点内容就是打断机制，注意到perform消费work和workLoop消费callback两个过程都要判断执行时间才能实现整体的打断。因为perform中是任务真正处理的逻辑，这里不判断work就会直接执行完，scheduler也无法调度了。perform里的打断后代码才会在5ms内回到workLoop代码中，这里再次判断执行时间并终止while循环，终止再次执行callback也就是perform并重新schedulePerformWorkUntilDeadline，到这里才真正让出了线程。
2. 执行时间超时和任务超时这两个概念注意不要混淆了。执行时间超时是指一个work/task会被检测是否执行超过了5ms，如果是的话就中断任务，让出线程。而任务超时是指当前时间是否已经超过了预设的过期时间，是的话就不再考虑执行时间，不会再对高优任务让步，而是会一次性执行完毕。

## 接下来做什么？
sheduler这个包仅仅是React调度的核心部分，想要了解react调度的全貌，比如想了解startTransition内部是如何调低更新的优先级的等问题，还需要了解lane模型以及demo中的work/shedule/perform在React源码到底是怎样的，有机会的话我会在另一篇文章中继续探究。
