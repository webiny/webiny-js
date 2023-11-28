import React from "react";

import { ReactComponent as Folder } from "@material-design-icons/svg/outlined/folder.svg";
import { ReactComponent as FolderShared } from "@material-design-icons/svg/outlined/folder_shared.svg";
import { ReactComponent as File } from "@material-design-icons/svg/outlined/description.svg";

import { useTableCell } from "~/admin/hooks/useTableCell";

import { RowIcon, RowText, RowTitle } from "./Cells.styled";
import { useNavigateFolder } from "@webiny/app-aco";
import { useRouter } from "@webiny/react-router";

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
    const { history } = useRouter();
    const query = new URLSearchParams(location.search);

    return (
        <RowTitle
            onClick={() => {
                query.set("id", id);
                history.push({ search: query.toString() });
                //onClick();
            }}
        >
            <RowIcon>
                <File />
            </RowIcon>
            <RowText use={"subtitle2"}>{name}</RowText>
        </RowTitle>
    );
};

export const CellName = () => {
    const { item, isPbPageItem } = useTableCell();

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
