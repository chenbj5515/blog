import React from 'react';
import './style.css';

export const Reader = (props: any) => {
    const Article = props.article;
    return (
        <div className="reader-box">
            <h1>{props.title}</h1>
            <time className="article-time">{props.time}</time>
            <div className="post-content">
                <Article />
            </div>
        </div>
    )
}