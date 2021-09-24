import React, { createContext, useCallback, useMemo } from "react";
import { Theme, Element, GetMediaQueryHandler, DisplayMode, ElementStylesHandler } from "~/types";
import { css as emotionCss } from "@emotion/css";

export const PageElementsContext = createContext(null);

export interface Props {
    elements: Record<string, React.ComponentType>;
    displayModes: Record<string, DisplayMode>;
    styles: Array<ElementStylesHandler>;
    getMediaQuery?: GetMediaQueryHandler;
    // ---
    attributes?: Array<Function>;
    theme?: Theme;
}

export interface PageElementsContextValue extends Props {
    getStyles: (args: { styles?: React.CSSProperties; element: Element }) => string;
}

const defaultGetMediaQuery: GetMediaQueryHandler = ({ displayMode, displayModeName }) => {
    if (displayModeName === "desktop") {
        return;
    }

    return `@media (max-width: ${displayMode.maxWidth}px)`;
};

export const PageElementsProvider: React.FC<Props> = ({
    children,
    theme = {},
    elements = {},
    styles = [],
    attributes = [],
    displayModes = {},
    getMediaQuery: customMediaQuery
}) => {
    const getMediaQuery = useMemo<GetMediaQueryHandler>(() => {
        return customMediaQuery || defaultGetMediaQuery;
    }, []);

    const getStyles = useCallback<PageElementsContextValue["getStyles"]>(
        ({ element, styles: initialStyles = {} }) => {
            const finalStyles = { ...initialStyles };
            for (const styleName in styles) {
                for (const displayModeName in displayModes) {
                    const displayMode = displayModes[displayModeName];
                    const mediaQuery = getMediaQuery({
                        displayMode,
                        displayModeName
                    });

                    const handlerStyles = styles[styleName]({
                        displayMode,
                        displayModeName,
                        element
                    });

                    if (mediaQuery) {
                        if (!finalStyles[mediaQuery]) {
                            finalStyles[mediaQuery] = {};
                        }
                        Object.assign(finalStyles[mediaQuery], handlerStyles);
                    } else {
                        Object.assign(finalStyles, handlerStyles);
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
        displayModes,
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
