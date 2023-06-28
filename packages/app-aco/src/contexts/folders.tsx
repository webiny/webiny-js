import React, { ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { dataLoader, loadingHandler } from "~/handlers";
import { FolderItem, Loading, LoadingActions } from "~/types";
import { AcoAppContext } from "~/contexts/app";
import { useFoldersApi } from "~/contexts/foldersApi";

interface FoldersContext {
    folders?: FolderItem[] | null;
    loading: Loading<LoadingActions>;
    listFolders: () => Promise<FolderItem[]>;
    getFolder: (id: string) => Promise<FolderItem>;
    createFolder: (folder: Omit<FolderItem, "id" | "type">) => Promise<FolderItem>;
    updateFolder: (folder: Omit<FolderItem, "type">) => Promise<FolderItem>;
    deleteFolder(folder: Pick<FolderItem, "id">): Promise<true>;
    getDescendantFolders(id?: string): FolderItem[];
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

export const FoldersProvider: React.VFC<Props> = ({ children, ...props }) => {
    const appContext = useContext(AcoAppContext);
    const [folders, setFolders] = useState<FolderItem[] | null>(null);
    const [loading, setLoading] = useState<Loading<LoadingActions>>(defaultLoading);
    const foldersApi = useFoldersApi();

    const app = appContext ? appContext.app : undefined;

    const type = props.type ?? app?.id;
    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

    useEffect(() => {
        return foldersApi.onCacheUpdate(folders => {
            setFolders(folders[type]);
        });
    }, []);

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

            async updateFolder(folder) {
                const { id, title, slug, parentId } = folder;

                return await dataLoader(loadingHandler("UPDATE", setLoading), () =>
                    foldersApi.updateFolder(type, {
                        id,
                        title,
                        slug,
                        parentId
                    })
                );
            },

            async deleteFolder(folder) {
                const { id } = folder;

                return await dataLoader(loadingHandler("DELETE", setLoading), () =>
                    foldersApi.deleteFolder(type, id)
                );
            },

            getDescendantFolders(id) {
                return foldersApi.getDescendantFolders(type, id);
            }
        };
    }, [folders, loading, setLoading, setFolders]);

    return <FoldersContext.Provider value={context}>{children}</FoldersContext.Provider>;
};
