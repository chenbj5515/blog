import React from 'react';
import './style.css';

export const DemoBox = (props: any) => {

    function handleFocus() {
        document.body.style.overflow = 'hidden';
    }
    
    function handleBlur() {
        document.body.style.overflow = 'auto';
    }

    return (
        <div id="demo-box" onMouseEnter={handleFocus} onMouseLeave={handleBlur} >
            {props.children}
        </div>
    )
}