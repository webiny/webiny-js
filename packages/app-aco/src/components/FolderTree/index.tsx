import React, { useMemo, useState } from "react";
import { useFolders } from "~/hooks/useFolders";
import { CreateButton } from "./ButtonCreate";
import { Empty } from "./Empty";
import { Loader } from "./Loader";
import { List } from "./List";
import { FolderDialogCreate } from "~/components";
import { Container } from "./styled";
import { FolderItem } from "~/types";
import { ROOT_FOLDER } from "~/constants";
import { Tooltip } from "@webiny/ui/Tooltip";

export { Loader };

export interface FolderTreeProps {
    onFolderClick: (data: FolderItem) => void;
    enableCreate?: boolean;
    rootFolderLabel?: string;
    enableActions?: boolean;
    focusedFolderId?: string;
    hiddenFolderIds?: string[];
}

export const FolderTree: React.VFC<FolderTreeProps> = ({
    focusedFolderId,
    hiddenFolderIds,
    enableActions,
    enableCreate,
    onFolderClick,
    rootFolderLabel
}) => {
    const { folders, folderLevelPermissions: flp } = useFolders();
    const localFolders = useMemo(() => {
        if (!folders) {
            return [];
        }

        return folders.reduce<FolderItem[]>((acc, item) => {
            if (item.id === ROOT_FOLDER && rootFolderLabel) {
                return [...acc, { ...item, title: rootFolderLabel }];
            }
            return [...acc, item];
        }, []);
    }, [folders]);

    const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);

    const renderList = () => {
        if (!folders) {
            return <Loader />;
        }

        let createButton = null;
        if (enableCreate) {
            const canCreate = flp.canManageStructure(focusedFolderId!);

            createButton = (
                <CreateButton disabled={!canCreate} onClick={() => setCreateDialogOpen(true)} />
            );

            if (!canCreate) {
                createButton = (
                    <Tooltip content={`Cannot create folder because you're not an owner.`}>
                        {createButton}
                    </Tooltip>
                );
            }
        }

        if (localFolders.length > 0) {
            return (
                <>
                    <List
                        folders={localFolders}
                        onFolderClick={onFolderClick}
                        focusedFolderId={focusedFolderId}
                        hiddenFolderIds={hiddenFolderIds}
                        enableActions={enableActions}
                    />
                    {enableCreate && createButton}
                </>
            );
        }

        return (
            <>
                <Empty />
                {createButton}
            </>
        );
    };
    return (
        <Container>
            {renderList()}
            {enableCreate && (
                <FolderDialogCreate
                    open={createDialogOpen}
                    onClose={() => setCreateDialogOpen(false)}
                    currentParentId={focusedFolderId}
                />
            )}
        </Container>
    );
};
