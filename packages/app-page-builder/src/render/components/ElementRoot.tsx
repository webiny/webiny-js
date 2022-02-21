import React, { CSSProperties, ReactElement, useMemo } from "react";
import kebabCase from "lodash/kebabCase";
import { plugins } from "@webiny/plugins";
import {
    PbRenderElementStylePlugin,
    PbRenderElementAttributesPlugin,
    PbElement,
    PbEditorElement
} from "~/types";
import { usePageBuilder } from "~/hooks/usePageBuilder";

type CombineClassNamesType = (...styles: string[]) => string;
const combineClassNames: CombineClassNamesType = (...styles) => {
    return styles.filter(s => s !== "" && s !== "css-0").join(" ");
};

interface ElementRootChildrenFunctionParamsType {
    getAllClasses: (...classes: string[]) => string;
    combineClassNames: (...classes: string[]) => string;
    elementStyle: CSSProperties;
    elementAttributes: { [key: string]: string };
    customClasses: string[];
}
type ElementRootChildrenFunction = (params: ElementRootChildrenFunctionParamsType) => ReactElement;

interface ElementRootProps {
    element: PbElement | PbEditorElement;
    style?: CSSProperties;
    className?: string;
    children?: ReactElement | ReactElement[] | ElementRootChildrenFunction;
}

const ElementRootComponent: React.FunctionComponent<ElementRootProps> = ({
    element,
    style,
    children,
    className = null
}) => {
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
        const stylePlugins = plugins.byType<PbRenderElementStylePlugin>(
            "pb-render-page-element-style"
        );
        // Reduce style
        return stylePlugins.reduce((accumulatedStyles, plugin) => {
            return plugin.renderStyle({ element: shallowElement, style: accumulatedStyles });
        }, style || {});
    }, [style, shallowElement.id, shallowElement.data]);

    const attributes = useMemo(() => {
        const attributePlugins = plugins.byType<PbRenderElementAttributesPlugin>(
            "pb-render-page-element-attributes"
        );
        return attributePlugins.reduce((accumulatedAttributes, plugin) => {
            return plugin.renderAttributes({
                element: shallowElement,
                attributes: accumulatedAttributes
            });
        }, {});
    }, [shallowElement.id]);

    const {
        responsiveDisplayMode: { displayMode }
    } = usePageBuilder();

    // required due to re-rendering when set content atom and still nothing in elements atom
    if (!element) {
        return null;
    }
    // Handle element visibility.// Use per-device style
    const visibility = finalStyle[`--${kebabCase(displayMode)}-visibility`];
    if (visibility === "hidden") {
        return null;
    }

    const classNames = element.data.settings?.className || "";

    const getAllClasses = (...extraClasses: string[]): string => {
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
