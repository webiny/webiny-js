import React from "react";
import { Text, Tree } from "@webiny/admin-ui";
import { ReactComponent as Folder } from "@webiny/icons/folder.svg";
import { ReactComponent as FolderShared } from "@webiny/icons/folder_shared.svg";
import { ReactComponent as HomeIcon } from "@webiny/icons/home.svg";
import { MenuActions } from "../MenuActions";
import { ROOT_FOLDER } from "~/constants";
import { useFolder } from "~/hooks";

interface FolderProps {
    text: string;
    isRoot: boolean;
    hasNonInheritedPermissions?: boolean;
    canManagePermissions?: boolean;
}

export const FolderNode = ({
    isRoot,
    hasNonInheritedPermissions,
    canManagePermissions,
    text
}: FolderProps) => {
    let icon = <HomeIcon />;

    if (!isRoot) {
        if (hasNonInheritedPermissions && canManagePermissions) {
            icon = <FolderShared />;
        } else {
            icon = <Folder />;
        }
    }

    return (
        <>
            <Tree.Item.Icon label={"Folder"} element={icon} />
            <Text as={"div"} className={"wby-truncate"}>
                {text}
            </Text>
        </>
    );
};

type NodeProps = {
    enableActions?: boolean;
};

export const Node = ({ enableActions }: NodeProps) => {
    const { folder } = useFolder();

    const { hasNonInheritedPermissions, canManagePermissions, title, id } = folder || {};
    const isRoot = id === ROOT_FOLDER;

    return (
        <>
            <FolderNode
                isRoot={isRoot}
                text={title}
                hasNonInheritedPermissions={hasNonInheritedPermissions}
                canManagePermissions={canManagePermissions}
            />
            {enableActions && !isRoot && <MenuActions />}
        </>
    );
};
