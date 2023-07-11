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
    // Let's ensure all of the possible breakpoints are initially defined. We are doing this
    // so that we can avoid breakpoint properties being added in a non-deterministic order.
    // In other words, we want to ensure that the order of the properties is always the same.
    // Without this step, we could end up with a situation where, for example, `@media (max-width: 600px)`
    // is defined before `@media (max-width: 400px)`, which is not what we want. We always want the
    // breakpoints to be defined in the same order as they are defined in the theme.
    const breakpoints = Object.values(theme.breakpoints);
    const styles = breakpoints.reduce<Record<string, any>>((current, item) => {
        current[item] = {};
        return current;
    }, {});

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
            breakpoints: theme.breakpoints || {},
            assignTo: styles,
            styles: styleValues || {}
        });
    }

    return styles;
};

export const defaultStylesCallback: StylesCallback = ({
    theme,
    styles,
    assignStyles: customAssignStylesCallback
}) => {
    let returnStyles = {};
    try {
        returnStyles = typeof styles === "function" ? styles(theme) : styles;
    } catch (e) {
        // Do nothing.
        console.warn("Could not load theme styles:");
        console.log(e);
    }

    const assign = customAssignStylesCallback || assignStyles;
    return assign({
        breakpoints: theme.breakpoints || {},
        styles: returnStyles
    });
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
