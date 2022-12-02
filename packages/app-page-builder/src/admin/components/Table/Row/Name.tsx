import React, { ReactElement } from "react";

import { ReactComponent as Folder } from "@material-design-icons/svg/outlined/folder.svg";
import { ReactComponent as File } from "@material-design-icons/svg/outlined/description.svg";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { useRouter } from "@webiny/react-router";

const Title = styled("div")`
    display: flex;
    align-items: center;
    cursor: pointer;
`;

const Icon = styled("div")`
    margin-right: 8px;
    height: 24px;
`;
interface Props {
    name: string;
    id: string;
}

interface PageProps extends Props {
    onClick: () => void;
}

export const FolderName = ({ name, id }: Props): ReactElement => {
    const { location, history } = useRouter();
    const query = new URLSearchParams(location.search);

    return (
        <Title
            onClick={() => {
                query.set("folderId", id);
                history.push({ search: query.toString() });
            }}
        >
            <Icon>
                <Folder />
            </Icon>
            <Typography use={"subtitle2"}>{name}</Typography>
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
            <Typography use={"subtitle2"}>{name}</Typography>
        </Title>
    );
};
