import React from "react";

const Hide = props => {
    let hide = false;
    if (typeof props.if === "function") {
        hide = props.if();
    } else if (props.if === true) {
        hide = true;
    }

    if (hide) {
        return <webiny-hide />;
    }

    const children = React.Children.toArray(props.children);
    if (children.length === 1) {
        return <webiny-hide>{children[0]}</webiny-hide>;
    }

    return <webiny-hide>{props.children}</webiny-hide>;
};

export default Hide;
