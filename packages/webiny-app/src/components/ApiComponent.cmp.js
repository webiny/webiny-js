import React from "react";

export default ({ children, ...props }) => {
    return React.cloneElement(children, props);
};
