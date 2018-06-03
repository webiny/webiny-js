import React from "react";

const WidgetContainer = ({ children, ...widgetProps }) => {
    return typeof children === "function"
        ? children({ widgetProps })
        : React.Children.map(children, child => React.cloneElement(child, { widgetProps }));
};

export default WidgetContainer;
