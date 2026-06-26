import React from "react";
import type { FolderTableRow } from "@webiny/app-aco";
import { Icon, Text } from "@webiny/admin-ui";
import { ReactComponent as Folder } from "@webiny/icons/folder.svg";
import { ReactComponent as FolderShared } from "@webiny/icons/folder_shared.svg";
import { useContentEntriesPresenter } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";

interface FolderNameCellProps {
    folder: FolderTableRow["data"];
}

export const FolderNameCell = ({ folder }: FolderNameCellProps) => {
    const presenter = useContentEntriesPresenter();

    let icon = <Folder />;
    if (folder.hasNonInheritedPermissions && folder.canManagePermissions) {
        icon = <FolderShared />;
    }

    return (
        <div
            className={
                "flex items-center gap-sm truncate cursor-pointer font-semibold hover:underline"
            }
            onClick={() => presenter.folders.selectFolder(folder.id)}
        >
            <Icon
                size={"sm"}
                color={"neutral-strong"}
                icon={icon}
                label={`Folder - ${folder.title}`}
            />
            <Text className={"truncate min-w-0 shrink"}>{folder.title}</Text>
        </div>
    );
};
