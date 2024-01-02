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
        /**
         * Not set on initializing of the context.
         */
        // @ts-expect-error
        client: null,
        data: {
            formBuilder: {
                listForms: {
                    data: [],
                    error: null
                }
            }
        },
        error: undefined,
        /**
         * Not set on initializing of the context.
         */
        // @ts-expect-error
        fetchMore: async () => {
            return {};
        },
        networkStatus: NetworkStatus.ready,
        /**
         * Not set on initializing of the context.
         */
        // @ts-expect-error
        refetch: async () => {
            return {};
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

interface FormsProviderProps {
    children: React.ReactNode;
}

export const FormsProvider = ({ children }: FormsProviderProps) => {
    const listQuery = useQuery<ListFormsQueryResponse>(LIST_FORMS);

    const { canCreate } = usePermission();

    const value: FormContextProvider = {
        canCreate,
        listQuery
    };

    return <FormsContext.Provider value={value}>{children}</FormsContext.Provider>;
};
