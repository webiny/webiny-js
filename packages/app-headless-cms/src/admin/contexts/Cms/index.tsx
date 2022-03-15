import React from "react";
import ApolloClient from "apollo-client";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { CircularProgress } from "@webiny/ui/Progress";
import { config as appConfig } from "@webiny/app/config";

export interface CmsContextValue {
    getApolloClient(locale: string): ApolloClient<any>;
    createApolloClient: CmsProviderProps["createApolloClient"];
    apolloClient: ApolloClient<any>;
}

export const CmsContext = React.createContext<CmsContextValue>({
    getApolloClient: () => {
        return null;
    },
    createApolloClient: () => {
        return null;
    },
    apolloClient: null
    /**
     * Safe to cast.
     */
} as unknown as CmsContextValue);

interface ApolloClientsCache {
    [locale: string]: ApolloClient<any>;
}

const apolloClientsCache: ApolloClientsCache = {};

export interface CmsProviderProps {
    createApolloClient: (params: { uri: string }) => ApolloClient<any>;
    children: React.ReactNode;
}

export const CmsProvider: React.FC<CmsProviderProps> = props => {
    const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL);
    const { getCurrentLocale } = useI18N();

    const currentLocale = getCurrentLocale("content");
    /**
     * TODO @ts-refactor @pavel did you think about this?
     */
    // TODO: not sure why this was necessary :thinking:
    // const hasPermission = identity.getPermission("cms.endpoint.manage");
    // if (!hasPermission) {
    //     return <CmsContext.Provider value={{}} {...props} />;
    // }

    if (currentLocale && !apolloClientsCache[currentLocale]) {
        apolloClientsCache[currentLocale] = props.createApolloClient({
            uri: `${apiUrl}/cms/manage/${currentLocale}`
        });
    }

    if (!currentLocale) {
        return <CircularProgress />;
    }

    const value = {
        getApolloClient(locale: string) {
            if (!apolloClientsCache[locale]) {
                apolloClientsCache[locale] = props.createApolloClient({
                    uri: `${apiUrl}/cms/manage/${locale}`
                });
            }
            return apolloClientsCache[locale];
        },
        createApolloClient: props.createApolloClient,
        apolloClient: apolloClientsCache[currentLocale]
    };

    return <CmsContext.Provider value={value} {...props} />;
};
