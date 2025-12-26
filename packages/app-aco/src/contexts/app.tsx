import React, { useMemo } from "react";
import type { ApolloClient } from "apollo-client";
import { DialogsProvider } from "@webiny/app-admin";
import type { AcoApp, AcoModel, AcoModelField } from "~/types.js";
import { FoldersProvider as FoldersContextProvider } from "./folders.js";
import { SearchRecordsProvider as SearchRecordsContextProvider } from "./records.js";
import { AcoListProvider } from "~/contexts/acoList.js";
import { NavigateFolderProvider } from "~/contexts/navigateFolder.js";
import type { ColumnConfig } from "~/config/table/Column.js";

export interface AcoAppProviderContext {
    app: AcoApp;
    folderIdPath: string;
    folderIdInPath: string;
    model: AcoModel;
    client: ApolloClient<any>;
}

export const AcoAppContext = React.createContext<AcoAppProviderContext | undefined>(undefined);

export type AcoAppProviderProps = {
    children: React.ReactNode;
    id: string;
    folderId: string | undefined;
    folderIdPath: string;
    client: ApolloClient<any>;
    navigateToFolder: (folderId: string) => void;
    createNavigateFolderStorageKey: () => string;
    model: AcoModel;
    columns: ColumnConfig[];
    own?: boolean;
    getFields?: () => AcoModelField[];
};

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

export const AcoAppProvider = ({
    children,
    id,
    client,
    model,
    columns,
    getFields,
    navigateToFolder,
    createNavigateFolderStorageKey,
    folderId,
    folderIdPath,
    own
}: AcoAppProviderProps) => {
    const app = useMemo(() => {
        return createAppFromModel({
            id,
            model,
            getFields
        });
    }, [model]);

    const folderIdInPath = folderIdPath + "_in";

    const value = useMemo<AcoAppProviderContext>(() => {
        return {
            app: app as AcoApp,
            folderIdPath,
            folderIdInPath,
            client,
            model: model as AcoModel
        };
    }, [app?.id, model, client]);

    return (
        <AcoAppContext.Provider value={value}>
            <FoldersContextProvider>
                <SearchRecordsContextProvider columns={columns}>
                    <NavigateFolderProvider
                        folderId={folderId}
                        createStorageKey={createNavigateFolderStorageKey}
                        navigateToFolder={navigateToFolder}
                    >
                        <AcoListProvider own={own} titleFieldId={model.titleFieldId}>
                            <DialogsProvider>{children}</DialogsProvider>
                        </AcoListProvider>
                    </NavigateFolderProvider>
                </SearchRecordsContextProvider>
            </FoldersContextProvider>
        </AcoAppContext.Provider>
    );
};
