// Provides a way to check whether the `PageElementsProvider` React component was mounted or not,
// in a non-React context. In React contexts, it's strongly recommended the value of `usePageElements`
// React hook is checked instead (a `null` value means the provider React component wasn't mounted).
import { type CSSObject } from "@emotion/react";
import emotionStyled from "@emotion/styled";
import React from "react";

import {
    AssignStylesCallback,
    Breakpoint,
    ElementRendererProps,
    ElementStylesCallback,
    StylesCallback,
    StylesObjects,
    ThemeStylesCallback
} from "~/types";

let usingPageElementsFlag = false;

export const usingPageElements = () => {
    return usingPageElementsFlag;
};

export const setUsingPageElements = (value: boolean) => {
    usingPageElementsFlag = value;
};

// Detect if we're working with a per-breakpoint object, or just a set of regular CSS properties.
export const isPerBreakpointStylesObject = ({
    breakpoints,
    styles
}: {
    breakpoints: Record<string, Breakpoint>;
    styles: StylesObjects;
}): boolean => {
    for (const breakpointName in breakpoints) {
        if (styles[breakpointName]) {
            return true;
        }
    }
    return false;
};

export const assignStyles: AssignStylesCallback = (args: {
    breakpoints: Record<string, Breakpoint>;
    styles: StylesObjects;
    assignTo?: CSSObject;
}) => {
    const { breakpoints, styles = {}, assignTo = {} } = args;
    if (isPerBreakpointStylesObject({ breakpoints, styles })) {
        for (const breakpointName in breakpoints) {
            const breakpoint = breakpoints[breakpointName];
            if (styles && styles[breakpointName]) {
                if (!assignTo[breakpoint.mediaQuery]) {
                    assignTo[breakpoint.mediaQuery] = {};
                }
                /**
                 * We must cast because it breaks on TS 4.7.4.
                 * Object is not undefined, so it is safe.
                 */
                Object.assign(assignTo[breakpoint.mediaQuery] as CSSObject, styles[breakpointName]);
            }
        }
    } else {
        Object.assign(assignTo, styles);
    }

    return assignTo;
};

export const defaultElementStylesCallback: ElementStylesCallback = ({
    element,
    modifiers,
    renderers,
    theme,
    assignStyles: customAssignStylesCallback
}) => {
    const styles: Record<string, any> = {};

    for (const modifierName in modifiers.styles) {
        const modifier = modifiers.styles[modifierName];

        const styleValues = modifier({
            element,
            theme,
            renderers,
            modifiers
        });


        const assign = customAssignStylesCallback || assignStyles;

        const bb =assign({
            breakpoints: theme.breakpoints || {},
            assignTo: styles,
            styles: styleValues || {}
        });

        if (modifierName === 'text' && element.id === "1eUZzAvoB") {
            console.log("--1-->", element);
        }
    }


    return [styles];
};

export const defaultThemeStylesCallback: ThemeStylesCallback = ({
    theme,
    getStyles,
    assignStyles: customAssignStylesCallback
}) => {
    let themeStyles = {};
    try {
        themeStyles = getStyles(theme);
    } catch (e) {
        // Do nothing.
        console.warn("Could not load theme styles:");
        console.log(e);
    }

    const assign = customAssignStylesCallback || assignStyles;
    const styles = assign({
        breakpoints: theme.breakpoints || {},
        styles: themeStyles
    });

    return [styles];
};

export const defaultStylesCallback: StylesCallback = ({ styles }) => [styles];

// Out of the box, Emotion doesn't work on custom elements (part of the Web components spec).
// That's why we've introduced this enhanced `styled`, which works with custom components too.
export const styled = (
    ...parameters: Parameters<typeof emotionStyled>
): ReturnType<typeof emotionStyled> => {
    const isCustomWebComponent = typeof parameters[0] === "string" && parameters[0].includes("-");
    if (isCustomWebComponent) {
        // Used `any` because I could not figure a proper type for the `props` param.
        return emotionStyled((props: any) => {
            const { children, className, ...rest } = props;
            const elementProps = { ...rest, class: className };
            return React.createElement(parameters[0], elementProps, children);
        });
    }

    return emotionStyled(...parameters);
};

export const elementDataPropsAreEqual = (
    prevProps: ElementRendererProps,
    nextProps: ElementRendererProps
) => {
    const prevElementDataHash = JSON.stringify(prevProps.element.data);
    const nextElementDataHash = JSON.stringify(nextProps.element.data);
    return prevElementDataHash === nextElementDataHash;
};