import React from "react";
import createApolloClient from "./createApolloClient";
import { useSecurity } from "@webiny/app-security";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { CircularProgress } from "@webiny/ui/Progress";

export const CmsContext = React.createContext({});

const apolloClientsCache = {};

export function CmsProvider(props) {
    const { identity } = useSecurity();
    const { getCurrentLocale } = useI18N();

    const currentLocale = getCurrentLocale("content");

    const hasPermission = identity.getPermission("cms.manage");
    if (!hasPermission) {
        return <CmsContext.Provider value={{}} {...props} />;
    }

    if (currentLocale && !apolloClientsCache[currentLocale]) {
        apolloClientsCache[currentLocale] = createApolloClient({
            uri: `${process.env.REACT_APP_API_URL}/cms/manage/${currentLocale}`
        });
    }

    const value = {
        getApolloClient(locale: string) {
            if (!apolloClientsCache[locale]) {
                apolloClientsCache[locale] = createApolloClient({
                    uri: `${process.env.REACT_APP_API_URL}/cms/manage/${locale}`
                });
            }
            return apolloClientsCache[locale];
        },
        apolloClient: apolloClientsCache[currentLocale]
    };

    if (!currentLocale) {
        return <CircularProgress />;
    }

    return <CmsContext.Provider value={value} {...props} />;
}
