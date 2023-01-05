import styled from "@emotion/styled";
import { Typography, TypographyProps } from "@webiny/ui/Typography";

export const Name = styled(Typography)<TypographyProps>`
    padding-left: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;
