import styled from "@emotion/styled";
import { Typography, TypographyProps } from "@webiny/ui/Typography";

export const FolderContainer = styled("div")`
    display: flex;
    align-items: center;
    background: var(--mdc-theme-surface);
    padding: 16px;
    border: 1px solid var(--mdc-theme-on-background);
    border-radius: 4px;
    cursor: pointer;
    max-width: 200px;
`;

export const Text = styled(Typography)`
    margin-left: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;
