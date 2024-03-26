import styled from "@emotion/styled";
import { Typography, TypographyProps } from "@webiny/ui/Typography";

export const Name = styled(Typography)<TypographyProps>`
    color: var(--mdc-theme-text-primary-on-background);
    padding-left: 8px;
    line-height: 48px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;
