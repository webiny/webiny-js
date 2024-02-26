import React, { ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { dataLoader, loadingHandler } from "~/handlers";
import { FolderItem, Loading, LoadingActions } from "~/types";
import { AcoAppContext } from "~/contexts/app";
import { useFoldersApi } from "~/hooks";
import { ROOT_FOLDER } from "~/constants";
import { useWcp } from "@webiny/app-wcp/hooks/useWcp";

export interface FoldersContextFolderLevelPermissions {
    canManageStructure(folderId: string): boolean;

    canManagePermissions(folderId: string): boolean;

    canManageContent(folderId: string): boolean;
}

interface FoldersContext {
    folders?: FolderItem[] | null;
    loading: Loading<LoadingActions>;
    listFolders: () => Promise<FolderItem[]>;
    getFolder: (id: string) => Promise<FolderItem>;
    createFolder: (folder: Omit<FolderItem, "id" | "type">) => Promise<FolderItem>;
    updateFolder: (
        folder: Omit<FolderItem, "type">,
        options?: Partial<{
            refetchFoldersList: boolean;
        }>
    ) => Promise<FolderItem>;

    deleteFolder(folder: Pick<FolderItem, "id">): Promise<true>;

    getDescendantFolders(id?: string): FolderItem[];

    folderLevelPermissions: FoldersContextFolderLevelPermissions;
}

export const FoldersContext = React.createContext<FoldersContext | undefined>(undefined);

interface Props {
    type?: string;
    children: ReactNode;
}

const defaultLoading: Record<LoadingActions, boolean> = {
    INIT: true,
    LIST: false,
    LIST_MORE: false,
    GET: false,
    MOVE: false,
    CREATE: false,
    UPDATE: false,
    DELETE: false
};

export const FoldersProvider = ({ children, ...props }: Props) => {
    const appContext = useContext(AcoAppContext);
    const [folders, setFolders] = useState<FolderItem[] | null>(null);
    const [loading, setLoading] = useState<Loading<LoadingActions>>(defaultLoading);
    const foldersApi = useFoldersApi();
    const { canUseFolderLevelPermissions } = useWcp();

    const app = appContext ? appContext.app : undefined;

    const type = props.type ?? app?.id;
    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

    useEffect(() => {
        return foldersApi.onFoldersChanged(type, folders => {
            setFolders(folders);
        });
    }, []);

    const folderLevelPermissions: FoldersContextFolderLevelPermissions = useMemo(() => {
        const createCanManage =
            (callback: (folder: FolderItem) => boolean) => (folderId: string) => {
                if (!canUseFolderLevelPermissions() || folderId === ROOT_FOLDER) {
                    return true;
                }

                const folder = folders?.find(folder => folder.id === folderId);
                if (!folder) {
                    return false;
                }

                return callback(folder);
            };

        return {
            canManageStructure: createCanManage(folder => folder.canManageStructure),
            canManagePermissions: createCanManage(folder => folder.canManagePermissions),
            canManageContent: createCanManage(folder => folder.canManageContent)
        };
    }, [folders]);

    const context = useMemo<FoldersContext>(() => {
        return {
            folders,
            loading,
            async listFolders() {
                const folders = await dataLoader(loadingHandler("LIST", setLoading), () =>
                    foldersApi.listFolders(type)
                );

                setFolders(() => folders);

                setLoading(prev => ({
                    ...prev,
                    INIT: false
                }));

                return folders;
            },

            async getFolder(id) {
                if (!id) {
                    throw new Error("Folder `id` is mandatory");
                }

                return await dataLoader(loadingHandler("GET", setLoading), () =>
                    foldersApi.getFolder(type, id)
                );
            },

            async createFolder(folder) {
                const newFolder = await dataLoader(loadingHandler("CREATE", setLoading), () =>
                    foldersApi.createFolder(type, folder)
                );

                return newFolder;
            },

            async updateFolder(folder, options) {
                const { id, title, slug, permissions, parentId } = folder;

                // We must omit all inherited permissions.
                const filteredPermissions = permissions.filter(p => !p.inheritedFrom);

                return await dataLoader(loadingHandler("UPDATE", setLoading), async () => {
                    const response = await foldersApi.updateFolder(type, {
                        id,
                        title,
                        slug,
                        permissions: filteredPermissions,
                        parentId
                    });

                    if (options?.refetchFoldersList) {
                        foldersApi.listFolders(type, { invalidateCache: true }).then(setFolders);
                    }

                    return response;
                });
            },

            async deleteFolder(folder) {
                const { id } = folder;

                return await dataLoader(loadingHandler("DELETE", setLoading), () =>
                    foldersApi.deleteFolder(type, id)
                );
            },

            getDescendantFolders(id) {
                return foldersApi.getDescendantFolders(type, id);
            },

            folderLevelPermissions
        };
    }, [folders, loading, setLoading, setFolders]);

    return <FoldersContext.Provider value={context}>{children}</FoldersContext.Provider>;
};
