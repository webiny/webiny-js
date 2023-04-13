import React, { ReactElement } from "react";

import { ReactComponent as Folder } from "@material-design-icons/svg/outlined/folder.svg";
import { ReactComponent as Image } from "@material-design-icons/svg/outlined/insert_photo.svg";
import { ReactComponent as File } from "@material-design-icons/svg/outlined/description.svg";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";

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

interface DefaultProps {
    name: string;
    id: string;
    onClick: (id: string) => void;
}

interface FileProps extends DefaultProps {
    type?: string;
}

export const FolderName = ({ name, id, onClick }: DefaultProps): ReactElement => {
    return (
        <Title onClick={() => onClick(id)}>
            <Icon>
                <Folder />
            </Icon>
            <Text use={"subtitle2"}>{name}</Text>
        </Title>
    );
};

export const FileName = ({ name, id, type, onClick }: FileProps): ReactElement => {
    return (
        <Title onClick={() => onClick(id)}>
            <Icon>{type && type.includes("image") ? <Image /> : <File />}</Icon>
            <Text use={"subtitle2"}>{name}</Text>
        </Title>
    );
};
