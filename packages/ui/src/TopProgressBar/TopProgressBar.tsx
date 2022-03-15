import React from "react";
import nprogress from "nprogress";
import "./style.scss";

export interface TopProgressBarRender {
    start: () => void;
    finish: () => void;
    nprogress: typeof nprogress;
}

export interface TopProgressBarProps {
    /**
     * Elements that require top loading bar to be shown.
     */
    children: (params: TopProgressBarRender) => React.ReactElement;
}

export const TopProgressBar = (props: TopProgressBarProps) => {
    return props.children({
        start: nprogress.start,
        finish: nprogress.done,
        nprogress
    });
};
