import React, { createContext, useCallback, useEffect } from "react";
import { PageElementsContextValue, PageElementsProviderProps } from "~/types";
import { css, cx } from "@emotion/css";
import { setUsingPageElements, assignStyles } from "~/utils";

export const PageElementsContext = createContext(null);

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

    // Provides a way to check whether the `PageElementsProvider` React component was mounted or not,
    // in a non-React context. In React contexts, it's strongly recommended the value of `usePageElements`
    // React hook is checked instead (a `null` value means the provider React component wasn't mounted).
    useEffect(() => setUsingPageElements(true), []);

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
