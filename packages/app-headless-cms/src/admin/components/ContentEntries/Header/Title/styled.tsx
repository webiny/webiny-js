import styled from "@emotion/styled";
import { Typography, TypographyProps } from "@webiny/ui/Typography";

export const Name = styled(Typography)<TypographyProps>`
    line-height: 48px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;
