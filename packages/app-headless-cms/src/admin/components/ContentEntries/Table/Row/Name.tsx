import React from "react";
import styled from "@emotion/styled";
import { ReactComponent as Folder } from "@material-design-icons/svg/outlined/folder.svg";
import { ReactComponent as FolderShared } from "@material-design-icons/svg/outlined/folder_shared.svg";
import { ReactComponent as File } from "@material-design-icons/svg/outlined/description.svg";
import { Typography } from "@webiny/ui/Typography";
import { FolderEntry, RecordEntry } from "~/admin/components/ContentEntries/Table/types";
import { useNavigateFolder } from "@webiny/app-aco";

const Title = styled("div")`
    display: flex;
    align-items: center;
    cursor: pointer;
`;

const Icon = styled("div")`
    margin-right: 8px;
    height: 24px;
`;

const Text = styled(Typography)`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

interface FolderNameProps {
    record: FolderEntry;
}

export const FolderName: React.VFC<FolderNameProps> = ({ record }) => {
    const { navigateToFolder } = useNavigateFolder();

    const { hasNonInheritedPermissions, canManagePermissions } = record.original;
    let icon = <Folder />;
    if (hasNonInheritedPermissions && canManagePermissions) {
        icon = <FolderShared />;
    }

    return (
        <Title onClick={() => navigateToFolder(record.id)}>
            <Icon>{icon}</Icon>
            <Text use={"subtitle2"}>{record.title}</Text>
        </Title>
    );
};

interface EntryNameProps {
    record: RecordEntry;
    onClick?: () => void;
}

export const EntryName: React.VFC<EntryNameProps> = ({ record, onClick }) => {
    return (
        <Title onClick={onClick} className="cms-data-list-record-title">
            <Icon>
                <File />
            </Icon>
            <Text use={"subtitle2"}>{record.title}</Text>
        </Title>
    );
};
