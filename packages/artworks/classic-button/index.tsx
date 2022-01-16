import React from 'react';
import './style.css';

interface IProps {
    text: string;
    width?: number;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}

export default function Button(props: IProps) {
    return (
        <button className="classic-button">
            <span className="shadow"></span>
            <span className="edge"></span>
            <span
                className="front text"
                {...props}
                style={{
                    width: `${props.width}px`
                }}
            >
                {props.text}
            </span>
        </button>
    )
}