import React from "react";
import { useQuery, QueryResult } from "react-apollo";
import gql from "graphql-tag";
import get from "lodash.get";

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

const I18NContext = React.createContext(null);
const defState = { initializing: false, currentLocale: null, locales: [] };

export type I18NContextValue = {
    refetchLocales(variables?: { [key: string]: any }): Promise<QueryResult>;
    state: {
        initializing: boolean;
        currentLocale?: {
            id: string;
            code: string;
        };
        locales: Array<{ id: string; code: string; default: boolean }>;
    };
};

const I18NProvider = ({ children, loader }) => {
    const { loading, data, refetch } = useQuery(getI18NInformation);

    if (loading && loader) {
        return loader;
    }

    const { currentLocale, locales } = get(data, "i18n.getI18NInformation", {});

    const value = {
        refetchLocales: refetch,
        state: {
            ...defState,
            currentLocale,
            locales
        }
    };

    return <I18NContext.Provider value={value}>{children}</I18NContext.Provider>;
};

export { I18NProvider, I18NContext };
