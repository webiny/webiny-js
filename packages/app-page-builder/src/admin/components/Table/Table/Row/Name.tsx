import React, { ReactElement } from "react";
import styled from "@emotion/styled";
import { ReactComponent as Folder } from "@material-design-icons/svg/outlined/folder.svg";
import { ReactComponent as File } from "@material-design-icons/svg/outlined/description.svg";
import { Typography } from "@webiny/ui/Typography";
import { useRouter } from "@webiny/react-router";
import { useNavigateFolder } from "@webiny/app-aco";
import { ReactComponent as FolderShared } from "@material-design-icons/svg/outlined/folder_shared.svg";

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

interface Props {
    name: string;
    id: string;
    hasNonInheritedPermissions?: boolean;
    canManagePermissions?: boolean;
}

interface PageProps extends Props {
    onClick: () => void;
}

export const FolderName = ({
    name,
    id,
    hasNonInheritedPermissions,
    canManagePermissions
}: Props): ReactElement => {
    const { navigateToFolder } = useNavigateFolder();

    let icon = <Folder />;
    if (hasNonInheritedPermissions && canManagePermissions) {
        icon = <FolderShared />;
    }

    return (
        <Title onClick={() => navigateToFolder(id)}>
            <Icon>{icon}</Icon>
            <Text use={"subtitle2"}>{name}</Text>
        </Title>
    );
};

export const PageName = ({ name, id, onClick }: PageProps): ReactElement => {
    const { history } = useRouter();
    const query = new URLSearchParams(location.search);

    return (
        <Title
            onClick={() => {
                query.set("id", id);
                history.push({ search: query.toString() });
                onClick();
            }}
        >
            <Icon>
                <File />
            </Icon>
            <Text use={"subtitle2"}>{name}</Text>
        </Title>
    );
};
