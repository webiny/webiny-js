import React from "react";

export function init(props: Object) {
    return {
        ...props
    };
}

export function i18nReducer(state: Object, action: Object) {
    const next = { ...state };
    switch (action.type) {
        case "data": {
            next.data = action.data;
            break;
        }
    }

    return next;
}

const I18NContext = React.createContext();

function I18NProvider(props) {
    const [state, dispatch] = React.useReducer(i18nReducer, props, init);

    const value = React.useMemo(() => {
        return {
            state,
            dispatch
        };
    });

    return <I18NContext.Provider value={value} {...props} />;
}

function useI18N() {
    const context = React.useContext(I18NContext);
    if (!context) {
        throw new Error("useI18N must be used within a I18NProvider");
    }

    const { state, dispatch } = context;
    const self = {
        // TODO: load these properly.
        acceptLanguage: "en-US",
        defaultLocale: "en-US",
        locales: ["en-US", "de-DE", "hr-HR"],
        getLocale() {
            return self.acceptLanguage || self.defaultLocale;
        },
        getLocales() {
            return self.locales;
        },
        state,
        dispatch
    };

    return self;
}

export { I18NProvider, useI18N };
