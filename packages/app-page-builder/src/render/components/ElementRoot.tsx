import React, { CSSProperties, ReactElement, useEffect, useRef } from "react";
import { plugins } from "@webiny/plugins";
import {
    PbRenderElementStylePlugin,
    PbRenderElementAttributesPlugin,
    PbElement
} from "@webiny/app-page-builder/types";

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
    element: PbElement;
    style?: CSSProperties;
    className?: string;
    children?: ReactElement | ReactElement[] | ElementRootChildrenFunction;
};

const ElementRootComponent: React.FunctionComponent<ElementRootProps> = ({
    element,
    style = {},
    children,
    className = null
}) => {
    const shallowElement = {
        id: element.id,
        type: element.type,
        data: element.data,
        elements: []
    };

    const stylePlugins = useRef<PbRenderElementStylePlugin[]>([]);
    const attributePlugins = useRef<PbRenderElementAttributesPlugin[]>([]);

    useEffect(() => {
        stylePlugins.current = plugins.byType<PbRenderElementStylePlugin>(
            "pb-render-page-element-style"
        );
        attributePlugins.current = plugins.byType<PbRenderElementAttributesPlugin>(
            "pb-render-page-element-attributes"
        );
    }, []);

    const finalStyle = stylePlugins.current.reduce((accumulatedStyles, plugin) => {
        return plugin.renderStyle({ element: shallowElement, style: accumulatedStyles });
    }, style);

    const attributes = attributePlugins.current.reduce((accumulatedAttributes, plugin) => {
        return plugin.renderAttributes({
            element: shallowElement,
            attributes: accumulatedAttributes
        });
    }, {});

    const classNames = element.data?.settings?.className || "";

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

const ElementRoot = React.memo(ElementRootComponent);

export { ElementRoot };
