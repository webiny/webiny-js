import React, { createContext, useCallback, useEffect, useState } from "react";
import {
    PageElementsContextValue,
    PageElementsProviderProps,
    ElementStylesCallback,
    StylesCallback,
    GetElementAttributes,
    GetElementStyles,
    GetStyles,
    AssignStylesCallback,
    SetElementStylesCallback,
    SetStylesCallback,
    SetAssignStylesCallback,
    GetRenderers
} from "~/types";
import {
    setUsingPageElements,
    defaultElementAttributesCallback,
    defaultElementStylesCallback,
    defaultStylesCallback
} from "~/utils";

export const PageElementsContext = createContext<PageElementsContextValue>(null as unknown as any);

export const PageElementsProvider: React.FC<PageElementsProviderProps> = ({
    children,
    theme,
    renderers = {},
    modifiers,
    beforeRenderer = null,
    afterRenderer = null
}) => {
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
        afterRenderer
    };

    return <PageElementsContext.Provider value={value}>{children}</PageElementsContext.Provider>;
};
