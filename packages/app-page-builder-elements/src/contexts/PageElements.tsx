import React, { createContext, useCallback } from "react";
import { Theme, Element, Breakpoint, ElementStylesHandler } from "~/types";
import { css as emotionCss } from "@emotion/css";

export const PageElementsContext = createContext(null);

export interface Props {
    elements: Record<string, React.ComponentType>;
    breakpoints: Record<string, Breakpoint>;
    styles: Array<ElementStylesHandler>;
    // ---
    attributes?: Array<Function>;
    theme?: Theme;
}

export interface PageElementsContextValue extends Props {
    getStyles: (args: { styles?: React.CSSProperties; element: Element }) => string;
}

export const PageElementsProvider: React.FC<Props> = ({
    children,
    theme = {},
    elements = {},
    styles = [],
    attributes = [],
    breakpoints = {}
}) => {
    const getStyles = useCallback<PageElementsContextValue["getStyles"]>(
        ({ element, styles: initialStyles = {} }) => {
            const finalStyles = { ...initialStyles };
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
                            if (!finalStyles[breakpoint.mediaQuery]) {
                                finalStyles[breakpoint.mediaQuery] = {};
                            }
                            Object.assign(finalStyles[breakpoint.mediaQuery], handlerStyles);
                        } else {
                            Object.assign(finalStyles, handlerStyles);
                        }
                    }
                }
            }

            return emotionCss(finalStyles);
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
