import React, { createContext, useCallback } from "react";
import {
    Breakpoint,
    StylesObjects,
    PageElementsContextValue,
    PageElementsProviderProps
} from "~/types";
import { css, cx, CSSObject } from "@emotion/css";

export const PageElementsContext = createContext(null);

// Detect if we're working with a per-breakpoint object, or just a set of regular CSS properties.
const isPerBreakpointStylesObject = ({
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

const assignStyles = (args: {
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

export const PageElementsProvider: React.FC<PageElementsProviderProps> = ({
    children,
    theme,
    renderers = {},
    modifiers
}) => {
    const getElementStyles = useCallback<PageElementsContextValue["getElementStyles"]>(element => {
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
    }, []);

    const getElementClassNames = useCallback<PageElementsContextValue["getElementClassNames"]>(
        element => {
            return getElementStyles(element).map(item => css(item));
        },
        []
    );

    const getThemeStyles = useCallback<PageElementsContextValue["getThemeStyles"]>(getStyles => {
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
    }, []);

    const getThemeClassNames = useCallback<PageElementsContextValue["getThemeClassNames"]>(
        getStyles => {
            const styles = getThemeStyles(getStyles);
            return styles.map(item => css(item));
        },
        []
    );

    const getStyles = useCallback<PageElementsContextValue["getStyles"]>(styles => {
        return [styles];
    }, []);

    const getClassNames = useCallback<PageElementsContextValue["getClassNames"]>(customStyles => {
        const styles = getStyles(customStyles);
        return styles.map(item => css(item));
    }, []);

    const value: PageElementsContextValue = {
        theme,
        renderers,
        modifiers,
        getElementStyles,
        getElementClassNames,
        getThemeStyles,
        getThemeClassNames,
        getStyles,
        getClassNames,
        combineClassNames: cx
    };

    return <PageElementsContext.Provider value={value}>{children}</PageElementsContext.Provider>;
};

export const PageElementsConsumer = ({ children }) => (
    <PageElementsContext.Consumer>
        {props => React.cloneElement(children, props)}
    </PageElementsContext.Consumer>
);
