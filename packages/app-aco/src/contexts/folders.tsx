import React, { ReactNode, useContext, useMemo } from "react";
import { useWcp } from "@webiny/app-wcp/hooks/useWcp";
import { useStateIfMounted } from "@webiny/app-admin";
import { FolderItem } from "~/types";
import { AcoAppContext } from "~/contexts/app";
import { ROOT_FOLDER } from "~/constants";

export interface FoldersContextFolderLevelPermissions {
    canManageStructure(folderId: string): boolean;

    canManagePermissions(folderId: string): boolean;

    canManageContent(folderId: string): boolean;
}

interface FoldersContext {
    type?: string | null;
    folderLevelPermissions: FoldersContextFolderLevelPermissions;
}

export const FoldersContext = React.createContext<FoldersContext | undefined>(undefined);

interface Props {
    type?: string;
    children: ReactNode;
}

export const FoldersProvider = ({ children, ...props }: Props) => {
    const appContext = useContext(AcoAppContext);
    const [folders, setFolders] = useStateIfMounted<FolderItem[] | null>(null);
    const { canUseFolderLevelPermissions } = useWcp();

    const app = appContext ? appContext.app : undefined;

    const type = props.type ?? app?.id;
    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

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
            folderLevelPermissions
        };
    }, [folders, setFolders]);

    return <FoldersContext.Provider value={context}>{children}</FoldersContext.Provider>;
};
