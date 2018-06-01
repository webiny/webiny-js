import React from "react";

const WidgetContainer = ({ children, ...props }) => {
    return children(props);
};

export default WidgetContainer;
