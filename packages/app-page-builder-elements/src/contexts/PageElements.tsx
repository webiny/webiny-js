import React, { createContext, useCallback } from "react";
import { Theme, Element, Breakpoint, ElementStylesHandler } from "~/types";
import { css as emotionCss } from "@emotion/css";

export const PageElementsContext = createContext(null);

export interface Props {
    elements: Record<string, React.ComponentType>;
    breakpoints: Record<string, Breakpoint>;
    styles: Array<ElementStylesHandler>;
    theme?: Theme;
    // ---
    attributes?: Array<Function>;
}

export interface PageElementsContextValue extends Props {
    getStyles: (args: { styles?: React.CSSProperties; element: Element }) => string;
    getThemeStyles: (args: { styles?: React.CSSProperties; element: Element }) => React.CSSProperties;
    getElementStyles: (args: { styles?: React.CSSProperties; element: Element }) => React.CSSProperties;
}

export const PageElementsProvider: React.FC<Props> = ({
    children,
    theme = {},
    elements = {},
    styles = [],
    attributes = [],
    breakpoints = {}
}) => {
    const getElementStyles = useCallback<PageElementsContextValue["getStyles"]>(
        ({ element, styles: initialStyles = {} }) => {
            const returnStyles = { ...initialStyles };
            for (const styleName in styles) {
                for (const breakpointName in breakpoints) {
                    const breakpoint = breakpoints[breakpointName];
                    const handlerStyles = styles[styleName]({
                        breakpoint,
                        breakpointName,
                        element
                    });

                    if (handlerStyles) {
                        if (breakpoint.mediaQuery) {
                            if (!returnStyles[breakpoint.mediaQuery]) {
                                returnStyles[breakpoint.mediaQuery] = {};
                            }
                            Object.assign(returnStyles[breakpoint.mediaQuery], handlerStyles);
                        } else {
                            Object.assign(returnStyles, handlerStyles);
                        }
                    }
                }
            }

            return emotionCss(returnStyles);
        },
        []
    );

    const getThemeStyles = useCallback<PageElementsContextValue["getStyles"]>(
        ({ theme: , styles: initialStyles = {} }) => {
            const returnStyles = { ...initialStyles };
            for (const breakpointName in breakpoints) {
                const breakpoint = breakpoints[breakpointName];
                if (theme[])
                const handlerStyles = styles[styleName]({
                    breakpoint,
                    breakpointName,
                    element
                });

                if (handlerStyles) {
                    if (breakpoint.mediaQuery) {
                        if (!returnStyles[breakpoint.mediaQuery]) {
                            returnStyles[breakpoint.mediaQuery] = {};
                        }
                        Object.assign(returnStyles[breakpoint.mediaQuery], handlerStyles);
                    } else {
                        Object.assign(returnStyles, handlerStyles);
                    }
                }
            }

            return emotionCss(returnStyles);
        },
        []
    );

    const getStyles = useCallback<PageElementsContextValue["getStyles"]>(
        ({ element, styles: initialStyles = {} }) => {
            const returnStyles = { ...initialStyles };
            for (const styleName in styles) {
                for (const breakpointName in breakpoints) {
                    const breakpoint = breakpoints[breakpointName];
                    const handlerStyles = styles[styleName]({
                        breakpoint,
                        breakpointName,
                        element
                    });

                    if (handlerStyles) {
                        if (breakpoint.mediaQuery) {
                            if (!returnStyles[breakpoint.mediaQuery]) {
                                returnStyles[breakpoint.mediaQuery] = {};
                            }
                            Object.assign(returnStyles[breakpoint.mediaQuery], handlerStyles);
                        } else {
                            Object.assign(returnStyles, handlerStyles);
                        }
                    }
                }
            }

            return emotionCss(returnStyles);
        },
        []
    );

    const value: PageElementsContextValue = {
        theme,
        elements,
        styles,
        attributes,
        breakpoints,
        getStyles
    };

    return <PageElementsContext.Provider value={value}>{children}</PageElementsContext.Provider>;
};

// TODO: pageBuilder?
export const PageElementsConsumer = ({ children }) => (
    <PageElementsContext.Consumer>
        {props => React.cloneElement(children, { pageBuilder: props })}
    </PageElementsContext.Consumer>
);
