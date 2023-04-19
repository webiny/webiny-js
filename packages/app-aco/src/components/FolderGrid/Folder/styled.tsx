import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { Menu } from "@webiny/ui/Menu";

export const FolderContainer = styled("div")`
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--mdc-theme-surface);
    padding: 4px 4px 4px 16px;
    border: 1px solid var(--mdc-theme-on-background);
    border-radius: 2px;
    cursor: pointer;
`;

export const FolderContent = styled("div")`
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow: hidden;
    width: 100%;
`;

export const Text = styled(Typography)`
    margin-left: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const Actions = styled(Menu)`
    width: 200px;
`;
