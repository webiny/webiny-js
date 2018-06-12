import React from "react";
import { withPage } from "./context/pageContext";

const WidgetContainer = ({ page, children, ...widgetProps }) => {
    const widgetContent =
        typeof children === "function"
            ? children({ page, widgetProps })
            : React.Children.map(children, child =>
                  React.cloneElement(child, { page, widgetProps })
              );

    const { style = {}} = widgetProps.widget.data;

    const { className: widgetClass, ...widgetStyle } = style.widget || {};
    const { className: contentClass, ...contentStyle } = style.content || {};

    return (
        <div className={widgetClass} style={widgetStyle}>
            <div className={contentClass} style={{ ...contentStyle, margin: "0 auto" }}>
                {widgetContent}
            </div>
        </div>
    );
};

export default withPage()(WidgetContainer);
