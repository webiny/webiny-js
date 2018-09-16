import React from "react";

const Show = props => {
    let show = false;
    if (typeof props.if === "function") {
        show = props.if();
    } else if (props.if === true) {
        show = true;
    }

    if (!show) {
        return <webiny-show />;
    }

    const children = React.Children.toArray(props.children);
    if (children.length === 1) {
        return <webiny-show>{children[0]}</webiny-show>;
    }

    return <webiny-show>{props.children}</webiny-show>;
};

export default Show;
