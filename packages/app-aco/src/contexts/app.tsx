import React, { useEffect, useMemo, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { AcoApp, AcoError, AcoModel, AcoModelField } from "~/types";
import { createGetAppQuery, GetAppResult, GetAppVariables } from "~/graphql/app.gql";
import { FoldersProvider as FoldersContextProvider } from "./folders";
import { SearchRecordsProvider as SearchRecordsContextProvider } from "./records";
import { Loader } from "~/components/FolderTree/Loader";
import { DisplayError } from "./DisplayError";

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

export interface AcoAppProviderPropsApi {
    children: React.ReactNode;
    id: string;
    model?: never;
    getFields?: never;
}

export interface AcoAppProviderPropsManual {
    children: React.ReactNode;
    id: string;
    model: AcoModel;
    getFields?: () => AcoModelField[];
}

export type AcoAppProviderProps = AcoAppProviderPropsApi | AcoAppProviderPropsManual;

interface CreateAppParams {
    id: string;
    model: AcoModel;
    getFields?: () => AcoModelField[];
}

const createApp = (data: CreateAppParams): AcoApp => {
    return {
        ...data,
        getFields:
            data.getFields ||
            (() => {
                return data.model.fields;
            })
    };
};

interface CreateApiAppParams {
    id: string;
    model: AcoModel;
}

const createApiApp = (data: CreateApiAppParams | null): AcoApp | null => {
    if (!data) {
        console.error(`The APP could not be created. No data received.`);
        return null;
    }
    const dataField = data.model.fields.find(f => f.fieldId === "data");
    if (!dataField) {
        console.error(`The APP "${data.id}" does not have the data field.`);
        return null;
    }
    return {
        ...data,
        getFields: () => {
            return dataField?.settings?.fields || [];
        }
    };
};

export const AcoAppProvider: React.VFC<AcoAppProviderProps> = ({
    children,
    id,
    model: inputModel,
    getFields
}) => {
    const client = useApolloClient();
    const [state, setState] = useState<AcoAppProviderState>({
        loading: false,
        app: null,
        model: null,
        error: null
    });

    /**
     * The APP Provider can operate in two modes:
     * * `app` - when the `id` is provided, the app is fetched from the API
     * * `model` - when the `model` is provided, the app is created from the model
     */
    useEffect(() => {
        if (!id) {
            return;
        }
        /**
         * In the `model` mode, we don't need to fetch the app from the API.
         * BUT, the input model must be `undefined`. In case it's `null`, just return because there will be a model at a point.
         */
        if (inputModel !== undefined) {
            if (!inputModel) {
                return;
            }
            setState(prev => {
                return {
                    ...prev,
                    loading: false,
                    model: inputModel,
                    app: createApp({
                        id,
                        model: inputModel,
                        getFields
                    })
                };
            });
            return;
        }
        if (id === state.app?.id) {
            return;
        }
        setState(prev => {
            return {
                ...prev,
                loading: true
            };
        });
        client
            .query<GetAppResult, GetAppVariables>({
                query: createGetAppQuery(),
                variables: {
                    id
                }
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
                    const app = createApiApp(data);
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
                        model: app.model,
                        error: null
                    };
                });
            });
    }, [id, inputModel?.modelId]);

    const { app, model, error, loading } = state;

    const value = useMemo<AcoAppProviderContext>(() => {
        return {
            app: app as AcoApp,
            loading,
            model: model as AcoModel,
            error
        };
    }, [app?.id, loading, error, model]);
    /**
     * Do not render anything yet if there is no application.
     */
    if (error) {
        return <div>Error: {error.message}</div>;
    } else if (loading) {
        return <Loader />;
    } else if (!app) {
        return (
            <DisplayError>
                There is no ACO App: <strong>{id}</strong>!
            </DisplayError>
        );
    } else if (!model) {
        return (
            <DisplayError>
                There is no model for the ACO App: <strong>{id}</strong>!
            </DisplayError>
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
