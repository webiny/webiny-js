import * as React from "react";
import nprogress from "nprogress";
import "./style.scss";

interface TopProgressBarRender {
    start: () => void;
    finish: () => void;
    nprogress: nprogress;
}

type Props = {
    // Elements that require top loading bar to be shown.
    children: (params: TopProgressBarRender) => React.ReactElement;
};

/**
 * Use `TopProgressBar` to let users know their actions are being processed.
 */
export const TopProgressBar = (props: Props) => {
    return props.children({
        start: nprogress.start,
        finish: nprogress.done,
        nprogress
    });
};
