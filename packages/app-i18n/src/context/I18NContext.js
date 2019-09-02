// @flow
// $FlowFixMe
import React, { useState, useMemo, useContext } from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";

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

const I18NProvider = ({ children }: Object) => {
    const [state, setState] = useState({ initializing: false, currentLocale: null, locales: [] });
    const { loading, data } = useQuery(getI18NInformation);

    const { currentLocale, locales } = get(data, "i18n.getI18NInformation", {});

    const value = useMemo(() => {
        return {
            state: {
                ...state,
                currentLocale,
                locales
            },
            setState
        };
    });

    if (loading) {
        return null;
    }

    return <I18NContext.Provider value={value}>{children}</I18NContext.Provider>;
};

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
