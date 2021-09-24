import React, { CSSProperties, ReactElement, useMemo } from "react";
import kebabCase from "lodash/kebabCase";
import { Element } from "~/types";
import { usePageElements } from "~/hooks/usePageElements";

type CombineClassNamesType = (...styles) => string;
const combineClassNames: CombineClassNamesType = (...styles) => {
    return styles.filter(s => s !== "" && s !== "css-0").join(" ");
};

type ElementRootChildrenFunctionParamsType = {
    getAllClasses: (...classes: string[]) => string;
    combineClassNames: (...classes: string[]) => string;
    elementStyle: CSSProperties;
    elementAttributes: { [key: string]: string };
    customClasses: string[];
};
type ElementRootChildrenFunction = (params: ElementRootChildrenFunctionParamsType) => ReactElement;

type ElementRootProps = {
    element: Element;
    style?: CSSProperties;
    className?: string;
    children?: ReactElement | ReactElement[] | ElementRootChildrenFunction;
};

const ElementRootComponent: React.FunctionComponent<ElementRootProps> = ({
    element,
    style,
    children,
    className = null
}) => {
    const {
        attributes: attributesHandlers,
        styles: ElementElementStylesHandlers,
        breakpoints,
        responsivebreakpoint: { breakpoint }
    } = usePageElements();

    const shallowElement = useMemo(
        () => ({
            id: element ? element.id : null,
            type: element ? element.type : null,
            data: element ? element.data : null,
            elements: []
        }),
        [element.id, element.data]
    );

    const finalStyle = useMemo(() => {
        // Reduce style
        return ElementElementStylesHandlers.reduce((accumulatedStyles, handler) => {
            return handler({ breakpoints, element: shallowElement, style: accumulatedStyles });
        }, style || {});
    }, [style, shallowElement.id, shallowElement.data]);

    const attributes = useMemo(() => {
        return attributesHandlers.reduce((accumulatedAttributes, plugin) => {
            return plugin.renderAttributes({
                element: shallowElement,
                attributes: accumulatedAttributes
            });
        }, {});
    }, [shallowElement.id]);

    // required due to re-rendering when set content atom and still nothing in elements atom
    if (!element) {
        return null;
    }
    // Handle element visibility.// Use per-device style
    const visibility = finalStyle[`--${kebabCase(breakpoint)}-visibility`];
    if (visibility === "hidden") {
        return null;
    }

    const classNames = element.data.settings?.className || "";

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
            elementAttributes: attributes,
            customClasses: classNames.split(" ")
        });
    }

    return (
        <div className={getAllClasses()} style={finalStyle} {...attributes}>
            {children}
        </div>
    );
};

export const ElementRoot = React.memo(ElementRootComponent);
