// @flow
// $FlowFixMe
import React, { useReducer, useMemo, useContext, useEffect } from "react";
import { withApollo } from "react-apollo";
import { listI18NLocales } from "./graphql";
import { get } from "lodash";

export function init(props: Object) {
    return {
        ...props,
        locales: []
    };
}

export function i18nReducer(state: Object, action: Object) {
    const next = { ...state };
    switch (action.type) {
        case "locales": {
            next.locales = action.value;
            break;
        }
    }

    return next;
}

const I18NContext = React.createContext();

const I18NProvider = withApollo(({ children, ...props }: Object) => {
    const [state, dispatch] = useReducer(i18nReducer, props, init);

    useEffect(() => {
        props.client.query({ query: listI18NLocales }).then(response => {
            dispatch({ type: "locales", value: get(response, "data.i18n.listI18NLocales.data") });
        });
    }, []);

    const value = useMemo(() => {
        return {
            state,
            dispatch
        };
    });

    return <I18NContext.Provider value={value}>{children}</I18NContext.Provider>;
});

function useI18N() {
    const context = useContext(I18NContext);
    if (!context) {
        throw new Error("useI18N must be used within a I18NProvider");
    }

    const { state, dispatch } = context;
    const self = {
        // TODO: check how to detect this - maybe we could do it in a separate API call ?
        acceptLanguage: "en-US",
        getDefaultLocale() {
            return state.locales.find(item => item.default === true);
        },
        getLocale() {
            return self.acceptLanguage || self.getDefaultLocale();
        },
        getLocales() {
            return state.locales;
        },
        translate(valueObject: ?Object): string {
            if (!valueObject) {
                return "";
            }

            if (Array.isArray(valueObject.values)) {
                const output = valueObject.values.find(item => item.locale === self.getLocale());
                return output ? output.value : "";
            }

            return valueObject.value || "";
        },
        state,
        dispatch
    };

    return self;
}

export { I18NProvider, useI18N };
