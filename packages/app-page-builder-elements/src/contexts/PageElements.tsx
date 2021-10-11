import React, { createContext, useCallback, useEffect, useState } from "react";
import {
    PageElementsContextValue,
    PageElementsProviderProps,
    ElementStylesCallback,
    StylesCallback,
    ThemeStylesCallback,
    GetElementClassNames,
    GetElementStyles,
    GetThemeStyles,
    GetThemeClassNames,
    GetStyles,
    GetClassNames
} from "~/types";
import { css, cx } from "@emotion/css";
import {
    setUsingPageElements,
    defaultElementStylesCallback,
    defaultThemeStylesCallback,
    defaultStylesCallback
} from "~/utils";

export const PageElementsContext = createContext(null);

export const PageElementsProvider: React.FC<PageElementsProviderProps> = ({
    children,
    theme,
    renderers = {},
    modifiers
}) => {
    const [customElementStylesCallback, setElementStylesCallback] =
        useState<ElementStylesCallback>();
    const [customThemeStylesCallback, setThemeStylesCallback] = useState<ThemeStylesCallback>();
    const [customStylesCallback, setStylesCallback] = useState<StylesCallback>();

    const getElementStyles = useCallback<GetElementStyles>(
        element => {
            const callback = customElementStylesCallback || defaultElementStylesCallback;
            return callback({ element, theme, renderers, modifiers });
        },
        [customElementStylesCallback]
    );

    const getElementClassNames = useCallback<GetElementClassNames>(
        element => {
            return getElementStyles(element).map(item => css(item));
        },
        [getElementStyles]
    );

    const getThemeStyles = useCallback<GetThemeStyles>(
        getStyles => {
            const callback = customThemeStylesCallback || defaultThemeStylesCallback;
            return callback({ getStyles, theme, renderers, modifiers });
        },
        [customThemeStylesCallback]
    );

    const getThemeClassNames = useCallback<GetThemeClassNames>(
        getStyles => {
            const styles = getThemeStyles(getStyles);
            return styles.map(item => css(item));
        },
        [getThemeStyles]
    );

    const getStyles = useCallback<GetStyles>(styles => {
        const callback = customStylesCallback || defaultStylesCallback;
        return callback({ styles, theme, renderers, modifiers });
    }, []);

    const getClassNames = useCallback<GetClassNames>(
        customStyles => {
            const styles = getStyles(customStyles);
            return styles.map(item => css(item));
        },
        [getStyles]
    );

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
        combineClassNames: cx,
        setElementStylesCallback,
        setThemeStylesCallback,
        setStylesCallback
    };

    return <PageElementsContext.Provider value={value}>{children}</PageElementsContext.Provider>;
};

export const PageElementsConsumer = ({ children }) => (
    <PageElementsContext.Consumer>
        {props => React.cloneElement(children, props)}
    </PageElementsContext.Consumer>
);
