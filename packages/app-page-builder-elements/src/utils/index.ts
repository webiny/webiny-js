// Provides a way to check whether the `PageElementsProvider` React component was mounted or not,
// in a non-React context. In React contexts, it's strongly recommended the value of `usePageElements`
// React hook is checked instead (a `null` value means the provider React component wasn't mounted).
import {Breakpoint, ElementStylesCallback, StylesCallback, StylesObjects, ThemeStylesCallback} from "~/types";
import { CSSObject } from "@emotion/css";

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

export const assignStyles = (args: {
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
                Object.assign(assignTo[breakpoint.mediaQuery], styles[breakpointName]);
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
    theme
}) => {
    const styles = {};

    for (const modifierName in modifiers.styles) {
        assignStyles({
            breakpoints: theme.breakpoints,
            assignTo: styles,
            styles: modifiers.styles[modifierName]({
                element,
                theme,
                renderers,
                modifiers
            })
        });
    }

    return [styles];
};

export const defaultThemeStylesCallback: ThemeStylesCallback = ({ theme, getStyles }) => {
    let themeStyles = {};
    try {
        themeStyles = getStyles(theme);
    } catch (e) {
        // Do nothing.
        console.warn("Could not load theme styles:");
        console.log(e);
    }

    const styles = assignStyles({
        breakpoints: theme.breakpoints,
        styles: themeStyles
    });

    return [styles];
};

export const defaultStylesCallback: StylesCallback = ({ styles }) => [styles];
