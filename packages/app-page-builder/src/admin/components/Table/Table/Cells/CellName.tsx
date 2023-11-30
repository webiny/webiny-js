import React from "react";

import { useNavigateFolder } from "@webiny/app-aco";
import { ReactComponent as Folder } from "@material-design-icons/svg/outlined/folder.svg";
import { ReactComponent as FolderShared } from "@material-design-icons/svg/outlined/folder_shared.svg";
import { ReactComponent as File } from "@material-design-icons/svg/outlined/description.svg";

import { PageListConfig } from "~/admin/config/pages";
import { usePagesList } from "~/admin/views/Pages/hooks/usePagesList";
import { RowIcon, RowText, RowTitle } from "./Cells.styled";

interface DefaultProps {
    name: string;
    id: string;
}

type PageCellNameProps = DefaultProps;

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

export const PageCellName = ({ name, id }: PageCellNameProps) => {
    const { openPreviewDrawer } = usePagesList();

    return (
        <RowTitle onClick={() => openPreviewDrawer(id)}>
            <RowIcon>
                <File />
            </RowIcon>
            <RowText use={"subtitle2"}>{name}</RowText>
        </RowTitle>
    );
};

export const CellName = () => {
    const { useTableCell, isPbPageItem } = PageListConfig.Browser.Table.Column;
    const { item } = useTableCell();

    if (isPbPageItem(item)) {
        return <PageCellName name={item.title} id={item.id} />;
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
