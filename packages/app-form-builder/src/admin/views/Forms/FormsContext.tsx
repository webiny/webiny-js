import React, { useMemo } from "react";
import { useQuery } from "@apollo/react-hooks";
import { QueryResult } from "@apollo/react-common";
import { useSecurity } from "@webiny/app-security";
import { LIST_FORMS, ListFormsQueryResponse } from "../../graphql";
import { NetworkStatus } from "apollo-client";
import { FormBuilderSecurityPermission } from "~/types";

export interface FormsContextValue {
    canCreate: boolean;
    listQuery: QueryResult<ListFormsQueryResponse>;
}

export const FormsContext = React.createContext<FormsContextValue>({
    canCreate: false,
    listQuery: {
        loading: false,
        variables: {},
        called: false,
        client: null as any,
        data: {
            formBuilder: {
                listForms: {
                    data: [],
                    error: null
                }
            }
        },
        error: undefined,
        fetchMore: async () => {
            return {} as any;
        },
        networkStatus: NetworkStatus.ready,
        refetch: async () => {
            return {} as any;
        },
        startPolling: () => {
            return void 0;
        },
        updateQuery: () => {
            return void 0;
        },
        stopPolling: () => {
            return void 0;
        },
        subscribeToMore: () => {
            return () => {
                return void 0;
            };
        }
    }
});

export interface FormContextProvider {
    canCreate: boolean;
    listQuery: QueryResult<ListFormsQueryResponse>;
}

interface FormsProviderProps {
    children: React.ReactNode;
}

export const FormsProvider: React.VFC<FormsProviderProps> = ({ children }) => {
    const { identity, getPermission } = useSecurity();
    const listQuery = useQuery<ListFormsQueryResponse>(LIST_FORMS);

    const canCreate = useMemo((): boolean => {
        const permission = getPermission<FormBuilderSecurityPermission>("fb.form");
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("w");
    }, [identity]);

    const value: FormContextProvider = {
        canCreate,
        listQuery
    };

    return <FormsContext.Provider value={value}>{children}</FormsContext.Provider>;
};
