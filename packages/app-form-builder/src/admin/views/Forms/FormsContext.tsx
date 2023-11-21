import React from "react";
import { useQuery } from "@apollo/react-hooks";
import { QueryResult } from "@apollo/react-common";
import { LIST_FORMS, ListFormsQueryResponse } from "../../graphql";
import { NetworkStatus } from "apollo-client";
import { usePermission } from "~/hooks/usePermission";

export interface FormsContextValue {
    canCreate: () => boolean;
    listQuery: QueryResult<ListFormsQueryResponse>;
}

export const FormsContext = React.createContext<FormsContextValue>({
    canCreate: () => false,
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
    canCreate: () => boolean;
    listQuery: QueryResult<ListFormsQueryResponse>;
}

export const FormsProvider: React.FC = ({ children }) => {
    const listQuery = useQuery<ListFormsQueryResponse>(LIST_FORMS);

    const { canCreate } = usePermission();

    const value: FormContextProvider = {
        canCreate,
        listQuery
    };

    return <FormsContext.Provider value={value}>{children}</FormsContext.Provider>;
};
