import React, { CSSProperties, ReactElement, useEffect, useRef } from "react";
import { getPlugins } from "@webiny/plugins";
import {
    PbRenderElementStylePlugin,
    PbRenderElementAttributesPlugin,
    PbElement
} from "@webiny/app-page-builder/types";

const Node = "div";

type CombineClassNamesType = (...styles) => string;
const combineClassNames: CombineClassNamesType = (...styles) => {
    return styles.filter(s => s !== "" && s !== "css-0").join(" ");
};

export type ElementRootChildrenFunction = (params: {
    getAllClasses(...classes: string[]): string;
    combineClassNames(...classes: string[]): string;
    elementStyle: CSSProperties;
    elementAttributes: { [key: string]: string };
    customClasses: string[];
}) => ReactElement;

export type ElementRootProps = {
    element: PbElement;
    style?: CSSProperties;
    className?: string;
    children?: ReactElement | ReactElement[] | ElementRootChildrenFunction;
};

const ElementRootComponent: React.FunctionComponent<ElementRootProps> = ({ element, style = {}, children, className = null }) => {

    const shallowElement = {
        id: element.id,
        type: element.type,
        data: element.data,
    };

    const stylePlugins = useRef<PbRenderElementStylePlugin[]>([]);
    const attributePlugins = useRef<PbRenderElementAttributesPlugin[]>([]);

    useEffect(() => {
        stylePlugins.current = getPlugins<PbRenderElementStylePlugin>("pb-render-page-element-style");
        attributePlugins.current = getPlugins<PbRenderElementAttributesPlugin>("pb-render-page-element-attributes");
    }, []);

    const finalStyle = this.stylePlugins.reduce((accumulatedStyles, plugin) => {
        return plugin.renderStyle({ element: shallowElement, accumulatedStyles });
    }, style);

    const attributes = this.attributePlugins.reduce((accumulatedAttributes, plugin) => {
        return plugin.renderAttributes({ element: shallowElement, accumulatedAttributes });
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
        <Node className={getAllClasses()} style={finalStyle} {...attributes}>
            {children}
        </Node>
    );
};

const ElementRoot = React.memo(ElementRootComponent);

export { ElementRoot };
