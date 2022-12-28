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
    SetAssignStylesCallback
} from "~/types";
import {
    setUsingPageElements,
    defaultElementAttributesCallback,
    defaultElementStylesCallback,
    defaultStylesCallback,
} from "~/utils";

export const PageElementsContext = createContext<PageElementsContextValue>(null as unknown as any);

export const PageElementsProvider: React.FC<PageElementsProviderProps> = ({
    children,
    theme,
    renderers = {},
    modifiers
}) => {
    // Attributes-related callbacks.
    const getElementAttributes = useCallback<GetElementAttributes>(element => {
        return defaultElementAttributesCallback({
            element,
            theme,
            renderers,
            modifiers,
        });
    }, []);

    // Styles-related callbacks.
    const [customAssignStylesCallback, setCustomAssignStylesCallback] =
        useState<AssignStylesCallback>();
    const [customElementStylesCallback, setCustomElementStylesCallback] =
        useState<ElementStylesCallback>();
    const [customStylesCallback, setCustomStylesCallback] =
        useState<StylesCallback>();

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
                assignStyles: customAssignStylesCallback
            });
        },
        [customElementStylesCallback, customAssignStylesCallback]
    );

    const getStyles = useCallback<GetStyles>(
        styles => {
            const callback = customStylesCallback || defaultStylesCallback;
            return callback({
                styles,
                theme,
                renderers,
                modifiers,
                assignStyles: customAssignStylesCallback
            });
        },
        [customStylesCallback, customAssignStylesCallback]
    );

    // Provides a way to check whether the `PageElementsProvider` React component was mounted or not,
    // in a non-React context. In React contexts, it's strongly recommended the value of `usePageElements`
    // React hook is checked instead (a `null` value means the provider React component wasn't mounted).
    useEffect(() => setUsingPageElements(true), []);

    const value: PageElementsContextValue = {
        theme,
        renderers,
        modifiers,
        getElementAttributes,
        getElementStyles,
        getStyles,
        setAssignStylesCallback,
        setElementStylesCallback,
        setStylesCallback
    };

    return <PageElementsContext.Provider value={value}>{children}</PageElementsContext.Provider>;
};

export const PageElementsConsumer: React.FC = ({ children }) => (
    <PageElementsContext.Consumer>
        {(props: any) => React.cloneElement(children as unknown as React.ReactElement, props)}
    </PageElementsContext.Consumer>
);
