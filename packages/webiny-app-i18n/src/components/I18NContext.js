// @flow
// $FlowFixMe
import React, { useReducer, useMemo, useContext, useEffect } from "react";
import { withApollo } from "react-apollo";
import gql from "graphql-tag";

export const listI18NLocales = gql`
    query ListI18NLocales {
        i18n {
            listI18NLocales {
                data {
                    id
                    code
                    default
                }
            }
        }
    }
`;

export function init(props: Object) {
    return {
        ...props,
        locales: [],
        acceptLanguage: "something" // TODO: check how to detect this - maybe we could do it in a separate API call ?
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
            dispatch({ type: "locales", value: response.data.i18n.listI18NLocales.data });
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
        return null;
    }

    const { state, dispatch } = context;
    const self = {
        getDefaultLocale() {
            return state.locales.find(item => item.default === true);
        },
        getLocale(id: ?string) {
            if (id) {
                return self.getLocales().find(item => item.id === id);
            }

            const locale = self.getLocales().find(item => item.code === state.acceptLanguage);
            if (locale) {
                return locale;
            }

            return self.getDefaultLocale();
        },
        getLocales() {
            return state.locales;
        },
        getValue(valueObject: ?Object): string {
            if (!valueObject) {
                return "";
            }

            if (Array.isArray(valueObject.values)) {
                const output = valueObject.values.find(item => item.locale === self.getLocale().id);
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
