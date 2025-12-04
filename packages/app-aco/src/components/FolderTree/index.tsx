import React, { useMemo } from "react";
import { Tooltip } from "@webiny/admin-ui";
import { useGetFolderHierarchy, useGetFolderLevelPermission } from "~/features/index.js";
import { ButtonCreate } from "./ButtonCreate/index.js";
import { Loader } from "./Loader/index.js";
import { List } from "./List/index.js";
import type { FolderItem } from "~/types.js";
import { ROOT_FOLDER } from "~/constants.js";
import type { FolderActionConfig } from "~/config/AcoConfig.js";

export { Loader };

export interface FolderTreeProps {
    folderActions?: FolderActionConfig[];
    onFolderClick: (data: FolderItem) => void;
    enableCreate?: boolean;
    rootFolderLabel?: string;
    enableActions?: boolean;
    dropConfirmation?: boolean;
    focusedFolderId?: string;
    hiddenFolderIds?: string[];
}

export const FolderTree = ({
    folderActions = [],
    focusedFolderId,
    hiddenFolderIds,
    enableActions,
    enableCreate,
    onFolderClick,
    dropConfirmation,
    rootFolderLabel
}: FolderTreeProps) => {
    const { folders, getIsFolderLoading } = useGetFolderHierarchy();
    const { getFolderLevelPermission: canManageStructure } =
        useGetFolderLevelPermission("canManageStructure");

    const localFolders = useMemo(() => {
        if (!folders) {
            return [];
        }

        return folders.map(item =>
            item.id === ROOT_FOLDER && rootFolderLabel ? { ...item, title: rootFolderLabel } : item
        );
    }, [folders, rootFolderLabel]);

    const createButton = useMemo(() => {
        if (!enableCreate) {
            return null;
        }

        const canCreate = canManageStructure(focusedFolderId!);
        const button = <ButtonCreate disabled={!canCreate} />;

        return canCreate ? (
            button
        ) : (
            <Tooltip
                content={`Cannot create folder because you're not an owner.`}
                trigger={button}
            />
        );
    }, [enableCreate, canManageStructure, focusedFolderId, localFolders]);

    if (getIsFolderLoading()) {
        return <Loader />;
    }

    return (
        <div className="my-xs">
            <List
                dropConfirmation={dropConfirmation}
                folders={localFolders}
                folderActions={folderActions}
                onFolderClick={onFolderClick}
                focusedFolderId={focusedFolderId}
                hiddenFolderIds={hiddenFolderIds}
                enableActions={enableActions}
            />
            {enableCreate && (
                <div className={"m-xs-plus mt-sm-plus mb-lg pl-sm-extra"}>{createButton}</div>
            )}
        </div>
    );
};
