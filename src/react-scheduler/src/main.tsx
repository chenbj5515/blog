import {
    unstable_IdlePriority as IdlePriority,
    unstable_ImmediatePriority as ImmediatePriority,
    unstable_LowPriority as LowPriority,
    unstable_NormalPriority as NormalPriority,
    unstable_UserBlockingPriority as UserBlockingPriority,
    unstable_getFirstCallbackNode as getFirstCallbackNode,
    unstable_scheduleCallback as scheduleCallback,
    unstable_shouldYield as shouldYield,
    unstable_cancelCallback as cancelCallback,
    CallbackNode
  } from "scheduler";
  
  import "./style.css";

  let counter = 0;
  
  type Priority =
    | typeof IdlePriority
    | typeof ImmediatePriority
    | typeof LowPriority
    | typeof NormalPriority
    | typeof UserBlockingPriority;
  
  interface Work {
    priority: Priority;
    count: number;
  }
  
  const priority2UseList: Priority[] = [
    ImmediatePriority,
    UserBlockingPriority,
    NormalPriority,
    LowPriority
  ];
  
  const priority2Name = [
    "noop",
    "ImmediatePriority",
    "UserBlockingPriority",
    "NormalPriority",
    "LowPriority",
    "IdlePriority"
  ];
  
  const root = document.querySelector("#root") as Element;
  const contentBox = document.querySelector("#content") as Element;
  
  const workList: Work[] = [];
  let prevPriority: Priority = IdlePriority;
  let curCallback: CallbackNode | null;
  
  // 初始化优先级对应按钮
  priority2UseList.forEach((priority, index) => {
    const btn = document.createElement("button");
    root.appendChild(btn);
    btn.innerText = priority2Name[priority];
    btn.className = `btn-${index}`;
    if (priority === LowPriority) {
      btn.onclick = () => {
        console.log('发起任务');
        // debugger
        // 插入工作
        workList.push({
          priority,
          count: 3000
        });
        schedule();
      };
    }
    else {
      btn.onclick = () => {
        console.log('增加了高优任务');
        // debugger
        // 插入工作
        workList.push({
          priority,
          count: 2000
        });
        schedule();
      };
    }
  });
  
  /**
   * 调度的逻辑
   */
  function schedule() {
    
    // 当前可能存在正在调度的回调
    const cbNode = getFirstCallbackNode();
    // 取出最高优先级的工作
    const curWork = workList.sort((w1, w2) => {
      return w1.priority - w2.priority;
    })[0];

    console.log('执行schedule', curWork?.priority);
    
  
    if (!curWork) {
      // 没有工作需要执行，退出调度
      curCallback = null;
      cbNode && cancelCallback(cbNode);
      return;
    }
  
    const { priority: curPriority } = curWork;
  
    if (curPriority === prevPriority) {
      // 有工作在进行，比较该工作与正在进行的工作的优先级
      // 如果优先级相同，则不需要调度新的，退出调度
      return;
    }
  
    // 准备调度当前最高优先级的工作
    // 调度之前，如果有工作在进行，则中断他
    cbNode && cancelCallback(cbNode);
  
    // 调度当前最高优先级的工作
    curCallback = scheduleCallback(curPriority, perform.bind(null, curWork));
  }
  
  // 执行具体的工作
  function perform(work: Work, didTimeout?: boolean): any {
    // 是否需要同步执行，满足1.工作是同步优先级 2.当前调度的任务过期了，需要同步执行
    const needSync = work.priority === ImmediatePriority || didTimeout;
    
    while ((needSync || !shouldYield()) && work.count) {
      work.count--;
      // 执行具体的工作
      insertItem(work.priority + "");
    }
    prevPriority = work.priority;
  
    if (!work.count) {
      // 完成的work，从workList中删除
      const workIndex = workList.indexOf(work);
      workList.splice(workIndex, 1);
      // 重置优先级
      prevPriority = IdlePriority;
    }
  
    const prevCallback = curCallback;
    console.log('perform');
    // 调度完后，如果callback变化，代表这是新的work
    schedule();
    const newCallback = curCallback;
  
    
    
    if (newCallback && prevCallback === newCallback) {
      console.log('callback没变');
      
      // callback没变，代表是同一个work，只不过时间切片时间用尽（5ms）
      // 返回的函数会被Scheduler继续调用
      return perform.bind(null, work);
    }
  }
  
  const insertItem = (content: string) => {
    const ele = document.createElement("span");
    ele.innerText = `${content}`;
    ele.className = `pri-${content}`;
    doSomeBuzyWork(100000);
    contentBox.appendChild(ele);
  };
  
  const doSomeBuzyWork = (len: number) => {
    let result = 0;
    while (len--) {
      result += len;
    }
  };
  