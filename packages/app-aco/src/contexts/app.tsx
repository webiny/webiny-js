import { useApolloClient } from "@apollo/react-hooks";
import React, { useEffect, useMemo, useState } from "react";
import { AcoApp, AcoError, AcoModel } from "~/types";
import { createGetAppQuery, GetAppResult, GetAppVariables, GraphQlAcoApp } from "~/graphql/app.gql";
import { FoldersProvider as FoldersContextProvider } from "./folders";
import { SearchRecordsProvider as SearchRecordsContextProvider } from "./records";

interface AcoAppProviderContext {
    app: AcoApp;
    model: AcoModel;
    loading: boolean;
    error?: AcoError | null;
}

interface AcoAppProviderState {
    loading: boolean;
    app?: AcoApp | null;
    model?: AcoModel | null;
    error?: AcoError | null;
}

export const AcoAppContext = React.createContext<AcoAppProviderContext | undefined>(undefined);

interface Props {
    children: React.ReactNode;
    model?: AcoModel | null;
    id: string;
}

const createApp = (data?: GraphQlAcoApp | null): AcoApp | null => {
    if (!data) {
        return null;
    }
    const dataField = data.model.fields.find(f => f.fieldId === "data");
    return {
        ...data,
        getFields: () => {
            return dataField?.settings?.fields || [];
        }
    };
};

export const AcoAppProvider: React.VFC<Props> = ({ children, id, model }) => {
    const client = useApolloClient();
    const [state, setState] = useState<AcoAppProviderState>({
        loading: false,
        app: null,
        model,
        error: null
    });

    useEffect(() => {
        if (!model) {
            return;
        }
        setState(prev => {
            return {
                ...prev,
                model
            };
        });
    }, [model?.modelId]);

    useEffect(() => {
        client
            .query<GetAppResult, GetAppVariables>({
                query: createGetAppQuery(),
                variables: {
                    id
                },
                fetchPolicy: "network-only"
            })
            .then(response => {
                const { data, error } = response.data.aco?.app || {};

                if (error) {
                    setState(prev => {
                        return {
                            ...prev,
                            loading: false,
                            app: null,
                            model: null,
                            error
                        };
                    });
                    return;
                }

                setState(prev => {
                    const app = createApp(data);
                    if (!app) {
                        return {
                            ...prev,
                            loading: false,
                            app: null,
                            model: null,
                            error: {
                                message: `App "${id}" not found!`,
                                code: "APP_NOT_FOUND"
                            }
                        };
                    }
                    return {
                        ...prev,
                        loading: false,
                        app,
                        model: model || app.model,
                        error: null
                    };
                });
            });
    }, [id]);

    const { app, model: stateModel, error, loading } = state;

    const value = useMemo<AcoAppProviderContext>(() => {
        return {
            app: app as AcoApp,
            loading,
            model: stateModel as AcoModel,
            error
        };
    }, [app?.id]);
    /**
     * Do not render anything yet if there is no application.
     */

    if (error) {
        return <div>Error: {error.message}</div>;
    } else if (loading) {
        return (
            <div>
                Loading app <strong>{id}</strong>...
            </div>
        );
    } else if (!app) {
        return (
            <div>
                There is no app <strong>{id}</strong>!
            </div>
        );
    } else if (!stateModel) {
        return (
            <div>
                There is no model in app <strong>{id}</strong>!
            </div>
        );
    }

    return (
        <AcoAppContext.Provider value={value}>
            <FoldersContextProvider>
                <SearchRecordsContextProvider>{children}</SearchRecordsContextProvider>
            </FoldersContextProvider>
        </AcoAppContext.Provider>
    );
};
