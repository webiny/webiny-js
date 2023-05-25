// Provides a way to check whether the `PageElementsProvider` React component was mounted or not,
// in a non-React context. In React contexts, it's strongly recommended the value of `usePageElements`
// React hook is checked instead (a `null` value means the provider React component wasn't mounted).
import { type CSSObject } from "@emotion/react";

import {
    AssignAttributesCallback,
    AssignStylesCallback,
    AttributesObject,
    ElementAttributesCallback,
    RendererProps,
    ElementStylesCallback,
    StylesCallback
} from "~/types";

import { StylesObject, ThemeBreakpoints, Typography, TypographyStyle } from "@webiny/theme/types";

let usingPageElementsFlag = false;

export const usingPageElements = () => {
    return usingPageElementsFlag;
};

export const setUsingPageElements = (value: boolean) => {
    usingPageElementsFlag = value;
};

export const assignAttributes: AssignAttributesCallback = (params: {
    attributes: AttributesObject;
    assignTo?: AttributesObject;
}) => {
    const { attributes = {}, assignTo = {} } = params;
    Object.assign(assignTo, attributes);
};

// Detect if we're working with a per-breakpoint object, or just a set of regular CSS properties.
export const isPerBreakpointStylesObject = ({
    breakpoints,
    styles
}: {
    breakpoints: ThemeBreakpoints;
    styles: StylesObject;
}): boolean => {
    for (const breakpointName in breakpoints) {
        if (styles[breakpointName]) {
            return true;
        }
    }
    return false;
};

// Detect if certain style is a transformed per-breakpoint CSS style object, or a transformed regular CSS properties.
export const isBreakpointCssStyle = ({
    breakpoints,
    styleName
}: {
    breakpoints: ThemeBreakpoints;
    styleName: string;
}): boolean => {
    for (const breakpointName in breakpoints) {
        if (breakpoints[breakpointName] === styleName) {
            return true;
        }
    }
    return false;
};

// separate style parts (modifiers) are assigned to different screen sizes one by one
// this means that "responsive" style properties are assigned
// in different order compared to theme.breakpoints order
// it causes not guaranteed CSS order (that causes UI issues)
// so we need to recreate styles object in proper order
// (here "order" refers to a for...in cycle order while iterating over the breakpoints)
// (so we need to recreate styles object adding properties in valid order)
// see "traversal order" section of for-in loop - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in#description
const recreateStyleObject = ({
    breakpoints,
    cssObject
}: {
    breakpoints: ThemeBreakpoints;
    cssObject: CSSObject;
}) => {
    const recreatedStyles: Record<string, any> = {};

    // copy plain styles as is
    for (const styleName in cssObject) {
        if (!isBreakpointCssStyle({ breakpoints, styleName })) {
            recreatedStyles[styleName] = cssObject[styleName];
        }
    }

    // copy "responsive" styles in breakpoint order
    for (const breakpointName in breakpoints) {
        const breakpoint = breakpoints[breakpointName];

        if (cssObject[breakpoint]) {
            recreatedStyles[breakpoint] = cssObject[breakpoint];
        }
    }

    return recreatedStyles;
};

export const assignStyles: AssignStylesCallback = (params: {
    breakpoints: ThemeBreakpoints;
    styles: StylesObject;
    assignTo?: CSSObject;
}) => {
    const { breakpoints, styles = {}, assignTo = {} } = params;
    if (isPerBreakpointStylesObject({ breakpoints, styles })) {
        for (const breakpointName in breakpoints) {
            const breakpoint = breakpoints[breakpointName];
            if (styles && styles[breakpointName]) {
                if (!assignTo[breakpoint]) {
                    assignTo[breakpoint] = {};
                }
                /**
                 * We must cast because it breaks on TS 4.7.4.
                 * Object is not undefined, so it is safe.
                 */
                Object.assign(assignTo[breakpoint] as CSSObject, styles[breakpointName]);
            }
        }
    } else {
        Object.assign(assignTo, styles);
    }

    return assignTo;
};

export const defaultElementAttributesCallback: ElementAttributesCallback = ({
    element,
    modifiers,
    renderers,
    theme
}) => {
    const attributes: Record<string, any> = {};

    for (const modifierName in modifiers.attributes) {
        const modifier = modifiers.attributes[modifierName];

        const attributesValues = modifier({
            element,
            theme,
            renderers,
            modifiers
        });

        assignAttributes({
            assignTo: attributes,
            attributes: attributesValues || {}
        });
    }

    return attributes;
};

export const defaultElementStylesCallback: ElementStylesCallback = ({
    element,
    modifiers,
    renderers,
    theme,
    assignStyles: customAssignStylesCallback
}) => {
    const cssObject: Record<string, any> = {};
    const breakpoints = theme.breakpoints || {};

    for (const modifierName in modifiers.styles) {
        const modifier = modifiers.styles[modifierName];

        const styleValues = modifier({
            element,
            theme,
            renderers,
            modifiers
        });

        const assign = customAssignStylesCallback || assignStyles;

        assign({
            breakpoints,
            assignTo: cssObject,
            styles: styleValues || {}
        });
    }

    return recreateStyleObject({ breakpoints, cssObject });
};

export const defaultStylesCallback: StylesCallback = ({
    theme,
    styles,
    assignStyles: customAssignStylesCallback
}) => {
    let returnStyles = {};
    const breakpoints = theme.breakpoints || {};

    try {
        returnStyles = typeof styles === "function" ? styles(theme) : styles;
    } catch (e) {
        // Do nothing.
        console.warn("Could not load theme styles:");
        console.log(e);
    }

    const assign = customAssignStylesCallback || assignStyles;
    const cssObject = assign({
        breakpoints,
        styles: returnStyles
    });

    return recreateStyleObject({ breakpoints, cssObject });
};

export const elementDataPropsAreEqual = (prevProps: RendererProps, nextProps: RendererProps) => {
    const prevElementDataHash = JSON.stringify(prevProps.element.data);
    const nextElementDataHash = JSON.stringify(nextProps.element.data);
    if (prevElementDataHash !== nextElementDataHash) {
        return false;
    }

    const prevRendererMetaHash = JSON.stringify(prevProps.meta);
    const nextRendererMetaHash = JSON.stringify(nextProps.meta);
    return prevRendererMetaHash === nextRendererMetaHash;
};

/*
 * Desc: CSSObject style
 * */
export const getTypographyStyleById = (
    typographyId: string,
    typography?: Typography
): CSSObject | undefined => {
    if (!typography) {
        return undefined;
    }
    for (const key in typography) {
        const typographyStyles = typography[key] as TypographyStyle[];
        const typographyStyle = typographyStyles.find(x => x.id === typographyId);
        if (typographyStyle) {
            return typographyStyle.styles;
        }
    }
    return undefined;
};
