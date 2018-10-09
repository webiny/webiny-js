import React from "react";
import { get } from "dot-prop-immutable";
import { css } from "emotion";

const Node = "div";

const getClassName = style => {
    if (Object.keys(style).length) {
        return css(style);
    }
    return null;
};

const combineClassNames = (...styles) => {
    return styles.filter(s => s !== "" && s !== "css-0").join(" ");
};

const ElementStyle = ({ style = {}, element, children, className = null }) => {
    const elementStyle = { ...style, ...get(element, "settings.style", {}) };
    const { inline = "", classNames = "" } = get(element, "settings.advanced.style") || {};

    const getAllClasses = (...extraClasses) => {
        return [
            className,
            ...extraClasses,
            getClassName(elementStyle),
            ...classNames.split(" "),
            inline.trim().length &&
                css`
                    ${inline};
                `
        ].filter(v => v && v !== "css-0").join(" ");
    };

    if (typeof children === "function") {
        return children({
            getAllClasses,
            combineClassNames,
            elementStyle,
            inlineStyle: css`
                ${inline.trim()};
            `,
            customClasses: classNames.split(" ")
        });
    }

    return <Node className={getAllClasses()}>{children}</Node>;
};

export default ElementStyle;
