import React from "react";
import { type FolderTableRow, useNavigateFolder } from "@webiny/app-aco";
import { Icon, Text } from "@webiny/admin-ui";
import { ReactComponent as Folder } from "@webiny/icons/folder.svg";
import { ReactComponent as FolderShared } from "@webiny/icons/folder_shared.svg";

interface FolderCellNameProps {
    folder: FolderTableRow["data"];
}

export const FolderCellName = ({ folder }: FolderCellNameProps) => {
    const { navigateToFolder } = useNavigateFolder();

    let icon = <Folder />;
    if (folder.hasNonInheritedPermissions && folder.canManagePermissions) {
        icon = <FolderShared />;
    }

    return (
        <div
            className={
                "flex items-center gap-sm truncate cursor-pointer font-semibold hover:underline"
            }
            onClick={() => navigateToFolder(folder.id)}
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
