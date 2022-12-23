import styled from "@emotion/styled";
import { Typography, TypographyProps } from "@webiny/ui/Typography";

export const Name = styled(Typography)<TypographyProps>`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;
