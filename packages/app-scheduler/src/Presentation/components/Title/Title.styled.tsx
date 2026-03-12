import styled from "@emotion/styled";
import type { TypographyProps } from "@webiny/ui/Typography/index.js";
import { Typography } from "@webiny/ui/Typography/index.js";

export const Name = styled(Typography)<TypographyProps>`
    color: var(--mdc-theme-text-primary-on-background);
    padding-left: 8px;
    line-height: 48px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;
