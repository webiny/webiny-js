import React from "react";
import { ReactComponent as Folder } from "@material-design-icons/svg/outlined/folder.svg";
import { ReactComponent as File } from "@material-design-icons/svg/outlined/description.svg";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { Link as DefaultLink, useRouter } from "@webiny/react-router";

interface Props {
    name: string;
    id: string;
}

const Title = styled("div")`
    display: flex;
    align-items: center;
    cursor: pointer;
`;

const Icon = styled("div")`
    margin-right: 8px;
    height: 24px;
`;

const Link = styled(DefaultLink)`
    color: var(--mdc-theme-text-primary-on-light);
    text-decoration: none !important;
`;

export const FolderName = ({ name, id }: Props) => {
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

export const PageName = ({ name, id }: Props) => {
    return (
        <Link to={`/page-builder/editor/${id}`}>
            <Title>
                <Icon>
                    <File />
                </Icon>
                <Typography use={"subtitle2"}>{name}</Typography>
            </Title>
        </Link>
    );
};
