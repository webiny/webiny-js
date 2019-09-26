// @flow
import * as React from "react";
import nprogress from "nprogress";
import "./style.scss";

type Props = {
    // Elements that require top loading bar to be shown.
    children: ({ start: Function, finish: Function, nprogress: nprogress }) => React.Node
};

/**
 * Use `TopProgressBar` to let users know their actions are being processed.
 */
const TopProgressBar = (props: Props) => {
    return props.children({
        start: nprogress.start,
        finish: nprogress.done,
        nprogress
    });
};

export { TopProgressBar };
