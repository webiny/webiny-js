// @flow
/* global window */
// $FlowFixMe
import React, { useState, useMemo, useContext, useEffect } from "react";
import { withApollo } from "react-apollo";
import gql from "graphql-tag";

export const getI18NInformation = gql`
    query GetI18NInformation {
        i18n {
            getI18NInformation {
                currentLocale {
                    id
                    code
                }
                locales {
                    id
                    code
                    default
                }
            }
        }
    }
`;

const I18NContext = React.createContext();

const I18NProvider = withApollo(({ children, ...props }: Object) => {
    const [state, setState] = useState({ initializing: false, currentLocale: null, locales: [] });

    useEffect(() => {
        setState({ ...state, initializing: true });
        props.client.query({ query: getI18NInformation }).then(async response => {
            const { currentLocale, locales } = response.data.i18n.getI18NInformation;
            setState({ ...state, currentLocale, locales, initializing: false });
        });
    }, []);

    const value = useMemo(() => {
        return {
            state,
            setState
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

            return state.currentLocale;
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
