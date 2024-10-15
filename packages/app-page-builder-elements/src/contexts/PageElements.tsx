import React, { createContext, useCallback, useEffect, useState } from "react";
import { ThemeProvider } from "@emotion/react";
import {
    AssignStylesCallback,
    ElementStylesCallback,
    GetElementAttributes,
    GetElementStyles,
    GetRenderers,
    GetStyles,
    PageElementsContextValue,
    PageElementsProviderProps,
    SetAssignStylesCallback,
    SetElementStylesCallback,
    SetStylesCallback,
    StylesCallback
} from "~/types";
import {
    defaultElementAttributesCallback,
    defaultElementStylesCallback,
    defaultStylesCallback,
    setUsingPageElements
} from "~/utils";

export const PageElementsContext = createContext<PageElementsContextValue>(
    null as unknown as PageElementsContextValue
);

export const PageElementsProvider = ({
    children,
    theme,
    renderers = {},
    modifiers,
    beforeRenderer = null,
    afterRenderer = null,
    enableLoaderCache
}: PageElementsProviderProps) => {
    // Attributes-related callbacks.
    const getElementAttributes = useCallback<GetElementAttributes>(
        element => {
            return defaultElementAttributesCallback({
                element,
                theme,
                renderers,
                modifiers,
                beforeRenderer,
                afterRenderer
            });
        },
        [theme]
    );

    // Styles-related callbacks.
    const [customAssignStylesCallback, setCustomAssignStylesCallback] =
        useState<AssignStylesCallback>();
    const [customElementStylesCallback, setCustomElementStylesCallback] =
        useState<ElementStylesCallback>();
    const [customStylesCallback, setCustomStylesCallback] = useState<StylesCallback>();

    const setAssignStylesCallback = useCallback<SetAssignStylesCallback>(callback => {
        setCustomAssignStylesCallback(() => callback);
    }, []);

    const setElementStylesCallback = useCallback<SetElementStylesCallback>(callback => {
        setCustomElementStylesCallback(() => callback);
    }, []);

    const setStylesCallback = useCallback<SetStylesCallback>(callback => {
        setCustomStylesCallback(() => callback);
    }, []);

    // Styles-related callbacks.
    const getElementStyles = useCallback<GetElementStyles>(
        element => {
            const callback = customElementStylesCallback || defaultElementStylesCallback;

            return callback({
                element,
                theme,
                renderers,
                modifiers,
                assignStyles: customAssignStylesCallback,
                beforeRenderer,
                afterRenderer
            });
        },
        [theme, customElementStylesCallback, customAssignStylesCallback]
    );

    const getStyles = useCallback<GetStyles>(
        styles => {
            const callback = customStylesCallback || defaultStylesCallback;
            return callback({
                styles,
                theme,
                renderers,
                modifiers,
                assignStyles: customAssignStylesCallback,
                beforeRenderer,
                afterRenderer
            });
        },
        [theme, customStylesCallback, customAssignStylesCallback]
    );

    const getRenderers = useCallback<GetRenderers>(() => {
        return typeof renderers === "function" ? renderers() : renderers;
    }, []);

    // Provides a way to check whether the `PageElementsProvider` React component was mounted or not,
    // in a non-React context. In React contexts, it's strongly recommended the value of `usePageElements`
    // React hook is checked instead (a `null` value means the provider React component wasn't mounted).
    useEffect(() => setUsingPageElements(true), []);

    const value: PageElementsContextValue = {
        theme,
        renderers,
        modifiers,
        getRenderers,
        getElementAttributes,
        getElementStyles,
        getStyles,
        setAssignStylesCallback,
        setElementStylesCallback,
        setStylesCallback,
        beforeRenderer,
        afterRenderer,
        enableLoaderCache
    };

    return (
        // We're passing an empty object just in case `theme` object is not provided.
        // This can happen in multi-theme setups, where the theme is loaded asynchronously.
        <ThemeProvider theme={theme || {}}>
            <PageElementsContext.Provider value={value}>{children}</PageElementsContext.Provider>
        </ThemeProvider>
    );
};
