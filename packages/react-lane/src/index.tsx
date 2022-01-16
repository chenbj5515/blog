// @ts-ignore
import React, {useEffect, useRef, useState, useTransition} from "react";
import {Reader} from 'packages/md-reader';
// @ts-ignore
import Lane from './lane.mdx';
import {DemoBox} from 'packages/demo-box';
import ArtButton from 'packages/artworks/classic-button';
import CoolButton from 'packages/artworks/cool-button';

import "./style.css";

const Demo = () => {
    console.log('rerender');
    
    const [counter, setCounter] = useState(0);
    const [counter1, setCounter1] = useState(0);
    const [isPending, startTransition] = useTransition();
    const [associatedWord, setAssociatedWord] = useState("");

    useEffect(() => {
        console.log('普通effect', counter);
    })

    function handleClick() {
        setCounter(counter + 1)
        console.log('%c 紧随setCounter后的代码', 'font-size: 36px;color: red;');
    }

    function handleClick2() {
        startTransition(() => {
            setCounter(counter + 1)
        })
        // console.log('紧随setCounter后的代码');
    }

    function handleClick3() {
        startTransition(() => {
            setCounter(counter + 1)
        })
        setCounter1(counter1 + 2);
    }

    function handleClick4() {
        setCounter(counter + 2)
        startTransition(() => {
            setCounter(counter + 1)
        })
    }

    function handleClick5() {
        startTransition(() => {
            setCounter(counter + 1)
        })
        setCounter(counter + 2)
    }

    function handleClick6() {
        startTransition(() => {
            setCounter(counter + 1)
        })
        let result = 0,
        len = 10000000000;
        while (len--) {
            result += len;
        }
    }

    function handleClick7() {
        console.log('第一个微任务');
        setCounter(1);
        Promise.resolve().then(() => {
            console.log('第二个微任务');
            setCounter(2);
            Promise.resolve().then(() => {
                console.log('第三个微任务');
                setCounter(3);
            })
        })
    }

    function handleChange(e: any) {
        startTransition(() => {
          setAssociatedWord(e.target.value);
        });
    }

    return (
        <DemoBox>
            <>
                <div className="demo-margin">
                    counter: {counter}
                </div>
                <div className="demo-margin">
                    counter1: {counter1}
                </div>
                <div className="demo-margin">
                    isPending: {isPending ? 'true' : 'false'}
                </div>
                <ArtButton width={200} onClick={handleClick} text="同步优先级的更新" />
                <ArtButton width={200} onClick={handleClick2} text="transition优先级的更新" />
                <ArtButton width={200} onClick={handleClick3} text="高优后发先至" />
                <ArtButton width={200} onClick={handleClick4} text="更新同一个状态，先高优" />
                <ArtButton width={200} onClick={handleClick5} text="更新同一个状态，先低优" />
                <ArtButton width={200} onClick={handleClick6} text="transition lane过期" />
                <ArtButton width={200} onClick={handleClick7} text="更新的合并" />
                <div className="demo-margin">
                    <input type="text" onChange={handleChange} />
                    {
                        Array(30000)
                            .fill("")
                            .map((_, index) => (
                                <div key={index}>{associatedWord}</div>
                            ))
                    }
                </div>
            </>
        </DemoBox>
    )
}

export default function () {
    return (
        <>
            <Reader article={Lane} title="Lane模型的工作原理" time="Dec 31, 2021" />
            <Demo />
        </>
    )
}