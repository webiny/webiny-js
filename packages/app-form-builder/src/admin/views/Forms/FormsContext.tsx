import React, { useMemo } from "react";
import { useQuery } from "@apollo/react-hooks";
import { QueryResult } from "@apollo/react-common";
import { useSecurity } from "@webiny/app-security";
import { LIST_FORMS } from "../../graphql";

export interface FormsContextValue {
    canCreate: boolean;
    listQuery: QueryResult<any, any>;
}

export const FormsContext = React.createContext<FormsContextValue>(null);

export const FormsProvider = ({ children }) => {
    const { identity } = useSecurity();
    const listQuery = useQuery(LIST_FORMS);

    const canCreate = useMemo(() => {
        const permission = identity.getPermission("fb.form");
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("w");
    }, []);

    const value = {
        canCreate,
        listQuery
    };

    return <FormsContext.Provider value={value}>{children}</FormsContext.Provider>;
};
