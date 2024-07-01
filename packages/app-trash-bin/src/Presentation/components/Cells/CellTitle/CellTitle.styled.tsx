import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";

export const RowTitle = styled("div")`
    display: flex;
    align-items: center;
`;

export const RowIcon = styled("div")`
    margin-right: 8px;
    height: 24px;
`;

export const RowText = styled(Typography)`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;
