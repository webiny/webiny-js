import React, { useRef } from "react";
import ApolloClient from "apollo-client";
import { useSecurity } from "@webiny/app-security";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { CircularProgress } from "@webiny/ui/Progress";

export const CmsContext = React.createContext({});

const apolloClientsCache = {};

type CmsProviderProps = {
    createApolloClient: (params: { uri: string }) => ApolloClient<any>;
    children: React.ReactNode;
};

export function CmsProvider(props: CmsProviderProps) {
    const { identity } = useSecurity();
    const { getCurrentLocale } = useI18N();
    const clientsRef = useRef({});

    const currentLocale = getCurrentLocale("content");

    const hasPermission = identity.getPermission("cms.endpoint.manage");
    if (!hasPermission) {
        return <CmsContext.Provider value={{}} {...props} />;
    }

    if (currentLocale && !apolloClientsCache[currentLocale]) {
        apolloClientsCache[currentLocale] = props.createApolloClient({
            uri: `${process.env.REACT_APP_API_URL}/cms/manage/${currentLocale}`
        });
    }

    const value = {
        getApolloClient(locale: string) {
            if (!apolloClientsCache[locale]) {
                apolloClientsCache[locale] = props.createApolloClient({
                    uri: `${process.env.REACT_APP_API_URL}/cms/manage/${locale}`
                });
            }
            return apolloClientsCache[locale];
        },
        createApolloClient: ({ uri }) => {
            if (!clientsRef.current[uri]) {
                clientsRef.current[uri] = props.createApolloClient({ uri });
            }

            return clientsRef.current[uri];
        },
        apolloClient: apolloClientsCache[currentLocale]
    };

    if (!currentLocale) {
        return <CircularProgress />;
    }

    return <CmsContext.Provider value={value} {...props} />;
}
