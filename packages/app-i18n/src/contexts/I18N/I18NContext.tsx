import React from "react";
import { useQuery, QueryResult } from "react-apollo";
import gql from "graphql-tag";
import get from "lodash.get";

export const GET_I18N_INFORMATION = gql`
    query GetI18NInformation {
        i18n {
            getI18NInformation {
                currentLocale {
                    code
                }
                locales {
                    code
                    default
                }
            }
        }
    }
`;

export const I18NContext = React.createContext(null);
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

export type I18NProviderProps = {
    children?: React.ReactNode;
    loader?: React.ReactElement;
};

export const I18NProvider = (props: I18NProviderProps) => {
    const { children, loader } = props;
    const { loading, data, refetch } = useQuery(GET_I18N_INFORMATION);

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
