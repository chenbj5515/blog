import React, {useEffect} from 'react';
import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";
import ReactDOM from 'react-dom';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import Scheduler from 'packages/react-scheduler/src'; 
import 'highlight.js/styles/monokai.css';
import './style.css';


const navs = [
    {
        name: 'React',
        link: '/react'
    },
    {
        name: '算法',
        link: ''
    },
    {
        name: '艺术评论',
        link: ''
    },
    {
        name: '观点',
        link: ''
    }
]

const sections = [
    {
        articles: [
            {
                title: 'React scheduler学习笔记',
                time: 'Dec 25, 2021',
                link: '/react-scheduler'
            }
        ],
        sectionId: '2021'
    }
]

const Main = () => {
    function mouseEnter(e: any) {
        e.target.style.transform = "perspective(500px) translateZ(120px)";
    }

    function mouseLeave(e: any) {
        e.target.style.transform = 'none';
    }
    return (
        <div className="shadows welcome" onMouseEnter={mouseEnter} onMouseLeave={mouseLeave}>
            Personal blog by Baijin Chen.
            <br />
            have fun, be awesome.
        </div>
    )
}

interface IArticle {
    title: string;
    time: string;
    link: string;
}

interface ISection {
    articles: IArticle[];
    sectionId: string;
}

const Sections = (props: {sections: ISection[]}) => {
    return (
        <>
            {
                props.sections.map((section, index) => (
                    <section className="section" key={index}>
                        <h4 className="section-title">{section.sectionId}</h4>
                        {section.articles.map((article) => (
                            <article className="article" key={article.title}>
                                <h2 className="article-title">{article.title}</h2>
                                <a className="article-link" href={article.link}></a>
                                <time className="article-time">{article.time}</time>
                            </article>
                        ))}
                    </section>
                ))
            }
        </>
    )
}


const App = () => {
    useEffect(() => {
        hljs.registerLanguage('javascript', javascript);
        hljs.highlightAll();
    }, []);

    return (
        <>
            <header className="header">
                <a className="profile" href="/"></a>
                <nav className="nav">
                    {
                        navs.map(nav => (
                            <a key={nav.name} href={nav.link}>{nav.name}</a>
                        ))
                    }
                </nav>
            </header>
            <main className="main">
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Main />} />
                        <Route path="/react" element={<Sections sections={sections}/>} />
                        <Route path="/react-scheduler" element={
                            <Scheduler />
                        } />
                    </Routes>
                </BrowserRouter>
            </main>
        </>
    )
}

// @ts-ignore
const root = ReactDOM.createRoot(document.querySelector('#root'));

root.render(<App />);