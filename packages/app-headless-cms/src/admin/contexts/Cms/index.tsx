import React from "react";
import createApolloClient from "./createApolloClient";
import { useSecurity } from "@webiny/app-security";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

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

    if (!apolloClientsCache[currentLocale]) {
        apolloClientsCache[currentLocale] = createApolloClient({
            uri: `${process.env.REACT_APP_API_URL}/cms/manage/${currentLocale}`
        });
    }
   
    const value = {
        apolloClient: apolloClientsCache[currentLocale]
    };

    return <CmsContext.Provider value={value} {...props} />;
}
