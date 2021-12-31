import React from 'react';
import './style.css';

interface IProps {
    text: string;
    width: number;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    left?: number;
    bottom?: number;
}

export default function (props: IProps) {
    return (
        <button className="cool-button" {...props} style={{
            marginLeft: props.left,
            marginBottom: props.bottom,
            width: props.width
        }} >
            {props.text}
        </button>
    )
}