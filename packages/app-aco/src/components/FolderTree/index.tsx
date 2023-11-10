import React, { useMemo } from "react";
import { useFolders } from "~/hooks/useFolders";
import { CreateButton } from "./ButtonCreate";
import { Empty } from "./Empty";
import { Loader } from "./Loader";
import { List } from "./List";
import { Container } from "./styled";
import { FolderItem } from "~/types";
import { ROOT_FOLDER } from "~/constants";
import { AcoWithConfig } from "~/config";

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
    const { folders } = useFolders();
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

    const renderList = () => {
        if (!folders) {
            return <Loader />;
        }

        if (localFolders.length > 0) {
            return (
                <AcoWithConfig>
                    <List
                        folders={localFolders}
                        onFolderClick={onFolderClick}
                        focusedFolderId={focusedFolderId}
                        hiddenFolderIds={hiddenFolderIds}
                        enableActions={enableActions}
                    />
                    {enableCreate && <CreateButton />}
                </AcoWithConfig>
            );
        }

        return (
            <>
                <Empty />
                <CreateButton />
            </>
        );
    };
    return <Container>{renderList()}</Container>;
};
