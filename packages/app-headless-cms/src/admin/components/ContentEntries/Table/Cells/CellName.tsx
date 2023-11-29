import React from "react";

import { ReactComponent as Folder } from "@material-design-icons/svg/outlined/folder.svg";
import { ReactComponent as FolderShared } from "@material-design-icons/svg/outlined/folder_shared.svg";
import { ReactComponent as File } from "@material-design-icons/svg/outlined/description.svg";
import { useNavigateFolder } from "@webiny/app-aco";

import { ContentEntryListConfig } from "~/admin/config/contentEntries";

import { RowIcon, RowText, RowTitle } from "./Cells.styled";

interface DefaultProps {
    name: string;
    id: string;
}

interface FileCellNameProps extends DefaultProps {
    type?: string;
}

interface FolderCellNameProps extends DefaultProps {
    canManagePermissions: boolean;
    hasNonInheritedPermissions: boolean;
}

export const FolderCellName = ({
    name,
    id,
    canManagePermissions,
    hasNonInheritedPermissions
}: FolderCellNameProps) => {
    const { navigateToFolder } = useNavigateFolder();

    let icon = <Folder />;
    if (hasNonInheritedPermissions && canManagePermissions) {
        icon = <FolderShared />;
    }

    return (
        <RowTitle onClick={() => navigateToFolder(id)}>
            <RowIcon>{icon}</RowIcon>
            <RowText use={"subtitle2"}>{name}</RowText>
        </RowTitle>
    );
};

export const EntryCellName = ({ name, id }: FileCellNameProps) => {
    return (
        <RowTitle onClick={() => console.log("id", id)}>
            <RowIcon>
                <File />
            </RowIcon>
            <RowText use={"subtitle2"}>{name}</RowText>
        </RowTitle>
    );
};

export const CellName = () => {
    const { useTableCell, isEntryItem } = ContentEntryListConfig.Browser.Table.Column;
    const { item } = useTableCell();

    if (isEntryItem(item)) {
        return <EntryCellName name={item.meta.title} id={item.id} />;
    }

    return (
        <FolderCellName
            name={item.title}
            id={item.id}
            canManagePermissions={item.canManagePermissions}
            hasNonInheritedPermissions={item.hasNonInheritedPermissions}
        />
    );
};
