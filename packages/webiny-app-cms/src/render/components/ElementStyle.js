// @flow
import React from "react";
import { get } from "dot-prop-immutable";
import { isEqual } from "lodash";

const Node = "div";

const combineClassNames = (...styles) => {
    return styles.filter(s => s !== "" && s !== "css-0").join(" ");
};

class ElementStyle extends React.Component<*> {
    shouldComponentUpdate(props: Object) {
        return (
            !isEqual(props.elementStyle, this.props.elementStyle) ||
            !isEqual(props.advancedStyle, this.props.advancedStyle) ||
            !isEqual(props.elementAttributes, this.props.elementAttributes)
        );
    }

    render() {
        const {
            style = {},
            elementStyle = {},
            advancedStyle = {},
            elementAttributes = {},
            children,
            className = null
        } = this.props;
        const finalStyle = { ...style, ...elementStyle };
        const { classNames = "" } = advancedStyle;

        const getAllClasses = (...extraClasses) => {
            return [className, ...extraClasses, ...classNames.split(" ")]
                .filter(v => v && v !== "css-0")
                .join(" ");
        };

        if (typeof children === "function") {
            return children({
                getAllClasses,
                combineClassNames,
                elementStyle: finalStyle,
                elementAttributes,
                customClasses: classNames.split(" ")
            });
        }

        return (
            <Node className={getAllClasses()} style={finalStyle} {...elementAttributes}>
                {children}
            </Node>
        );
    }
}

const DEF = {};

const getElementStyleProps = (element: Object) => {
    return {
        elementStyle: get(element, "settings.style", DEF),
        advancedStyle: get(element, "settings.advanced.style", DEF)
    };
};

const getElementAttributeProps = (element: Object) => {
    return {
        elementAttributes: get(element, "settings.attributes", DEF)
    };
};

export { ElementStyle, getElementStyleProps, getElementAttributeProps };
