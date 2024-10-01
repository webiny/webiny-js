import React, { useEffect, useMemo, useState } from "react";
import { ApolloClient } from "apollo-client";
import { CircularProgress } from "@webiny/ui/Progress";
import { DialogsProvider } from "@webiny/app-admin";
import { AcoApp, AcoAppMode, AcoError, AcoModel, AcoModelField } from "~/types";
import { createGetAppQuery, GetAppResult, GetAppVariables } from "~/graphql/app.gql";
import { FoldersProvider as FoldersContextProvider } from "./folders";
import { SearchRecordsProvider as SearchRecordsContextProvider } from "./records";
import { DisplayError } from "./DisplayError";
import { NavigateFolderWithRouterProvider } from "~/contexts/navigateFolderWithRouter";
import { AcoListProvider } from "~/contexts/acoList";

export interface AcoAppProviderContext {
    app: AcoApp;
    folderIdPath: string;
    folderIdInPath: string;
    model: AcoModel;
    client: ApolloClient<any>;
    loading: boolean;
    error?: AcoError | null;
    mode: AcoAppMode;
}

interface AcoAppProviderState {
    loading: boolean;
    app?: AcoApp | null;
    model?: AcoModel | null;
    error?: AcoError | null;
    mode: AcoAppMode;
}

export const AcoAppContext = React.createContext<AcoAppProviderContext | undefined>(undefined);

interface BaseAcoAppProviderProps {
    children: React.ReactNode;
    id: string;
    folderIdPath?: string;
    folderIdQueryString?: string;
    client: ApolloClient<any>;
    createNavigateFolderListLink?: () => string;
    createNavigateFolderStorageKey: () => string;
    own?: boolean;
}

export interface AcoAppProviderPropsApi extends BaseAcoAppProviderProps {
    model?: never;
    getFields?: never;
}

export interface AcoAppProviderPropsManual extends BaseAcoAppProviderProps {
    model: AcoModel;
    getFields?: () => AcoModelField[];
}

export type AcoAppProviderProps = AcoAppProviderPropsApi | AcoAppProviderPropsManual;

interface CreateAppParams {
    id: string;
    model: AcoModel;
    getFields?: () => AcoModelField[];
}

export const createAppFromModel = (data: CreateAppParams): AcoApp => {
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

export const AcoAppProvider = ({
    children,
    id,
    client,
    model: inputModel,
    getFields,
    folderIdQueryString,
    createNavigateFolderListLink,
    createNavigateFolderStorageKey,
    folderIdPath: initialFolderIdPath,
    own
}: AcoAppProviderProps) => {
    const [state, setState] = useState<AcoAppProviderState>({
        loading: false,
        app: null,
        model: null,
        error: null,
        mode: "aco"
    });
    const folderIdPath = initialFolderIdPath || "location.folderId";
    const folderIdInPath = folderIdPath + "_in";

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
                    app: createAppFromModel({
                        id,
                        model: inputModel,
                        getFields
                    }),
                    mode: "cms"
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
                            error,
                            mode: "aco"
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
                            mode: "aco",
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
                        error: null,
                        mode: "aco"
                    };
                });
            });
    }, [id, inputModel?.modelId]);

    const { app, model, error, loading, mode } = state;

    const value = useMemo<AcoAppProviderContext>(() => {
        return {
            app: app as AcoApp,
            folderIdPath,
            folderIdInPath,
            loading,
            client,
            model: model as AcoModel,
            error,
            mode
        };
    }, [app?.id, loading, error, model, client, mode]);
    /**
     * Do not render anything yet if there is no application.
     */
    if (error) {
        return <div>Error: {error.message}</div>;
    } else if (loading) {
        return <CircularProgress />;
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
                <SearchRecordsContextProvider>
                    <NavigateFolderWithRouterProvider
                        folderIdQueryString={folderIdQueryString}
                        createListLink={createNavigateFolderListLink}
                        createStorageKey={createNavigateFolderStorageKey}
                    >
                        <AcoListProvider own={own} titleFieldId={model.titleFieldId}>
                            <DialogsProvider>{children}</DialogsProvider>
                        </AcoListProvider>
                    </NavigateFolderWithRouterProvider>
                </SearchRecordsContextProvider>
            </FoldersContextProvider>
        </AcoAppContext.Provider>
    );
};
