import React, { createContext, useCallback } from "react";
import { Theme, Element, ElementStylesModifier, ElementRenderer, Breakpoint } from "~/types";
import { css, CSSObject } from "@emotion/css";
import * as emotion from "@emotion/css";
import { Emotion } from "@emotion/css/create-instance";

export const PageElementsContext = createContext(null);

export interface Props {
    theme: Theme;
    renderers?: Record<string, ElementRenderer>;
    modifiers: {
        styles: Record<string, ElementStylesModifier>;
    };
}

export interface PageElementsContextValue extends Props {
    css: Emotion;
    getStyles: (element: Element) => Array<CSSObject>;
    getCss: (element: Element) => Array<string>;
    getThemeStyles: (getStyles: (theme: Theme) => Record<string, any>) => Array<CSSObject>;
    getThemeCss: (getStyles: (theme: Theme) => Record<string, any>) => Array<string>;
    getCustomStyles: (styles: CSSObject) => Array<CSSObject>;
    getCustomCss: (styles: CSSObject) => Array<string>;
}

const assignStylesByBreakpoints = (args: {
    breakpoints: Record<string, Breakpoint>;
    styles: CSSObject | ((breakpoint: Breakpoint, breakpointName: string) => CSSObject);
    assignTo?: CSSObject;
}) => {
    const { breakpoints, styles, assignTo = {} } = args;
    for (const breakpointName in breakpoints) {
        const breakpoint = breakpoints[breakpointName];
        const assign = typeof styles === "function" ? styles(breakpoint, breakpointName) : styles;

        if (assign && assign[breakpointName]) {
            if (!assignTo[breakpoint.mediaQuery]) {
                assignTo[breakpoint.mediaQuery] = {};
            }
            Object.assign(assignTo[breakpoint.mediaQuery], assign[breakpointName]);
        }
    }

    return assignTo;
};

export const PageElementsProvider: React.FC<Props> = ({
    children,
    theme,
    renderers = {},
    modifiers
}) => {
    const getStyles = useCallback<PageElementsContextValue["getStyles"]>(element => {
        const styles = {};

        for (const modifierName in modifiers.styles) {
            assignStylesByBreakpoints({
                breakpoints: theme.breakpoints,
                assignTo: styles,
                styles: (breakpoint, breakpointName) => {
                    return {
                        [breakpointName]: modifiers.styles[modifierName]({
                            breakpoint,
                            breakpointName,
                            element
                        })
                    };
                }
            });
        }

        return [styles];
    }, []);

    const getCss = useCallback<PageElementsContextValue["getCss"]>(element => {
        const styles = getStyles(element);
        return styles.map(item => css(item));
    }, []);

    const getThemeStyles = useCallback<PageElementsContextValue["getThemeStyles"]>(getStyles => {
        const styles = assignStylesByBreakpoints({
            breakpoints: theme.breakpoints,
            styles: getStyles(theme)
        });

        console.log("vracvam stylse", styles);
        return [styles];
    }, []);

    const getThemeCss = useCallback<PageElementsContextValue["getThemeCss"]>(getStyles => {
        const styles = getThemeStyles(getStyles);
        return styles.map(item => css(item));
    }, []);

    const getCustomStyles = useCallback<PageElementsContextValue["getCustomStyles"]>(styles => {
        return [styles];
    }, []);

    const getCustomCss = useCallback<PageElementsContextValue["getCustomCss"]>(customStyles => {
        const styles = getCustomStyles(customStyles);
        return styles.map(item => css(item));
    }, []);

    const value: PageElementsContextValue = {
        theme,
        renderers,
        modifiers,
        css: emotion,
        getStyles,
        getCss,
        getThemeStyles,
        getThemeCss,
        getCustomStyles,
        getCustomCss
    };

    return <PageElementsContext.Provider value={value}>{children}</PageElementsContext.Provider>;
};

export const PageElementsConsumer = ({ children }) => (
    <PageElementsContext.Consumer>
        {props => React.cloneElement(children, props)}
    </PageElementsContext.Consumer>
);
