import styled from "@emotion/styled";

import { Typography } from "@webiny/ui/Typography";

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

export const Grid = styled("div")`
    width: 100%;
    display: grid;
    /* define the number of grid columns */
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    column-gap: 16px;
    row-gap: 16px;
`;
