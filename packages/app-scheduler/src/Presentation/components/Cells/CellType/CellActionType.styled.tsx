import styled from "@emotion/styled";
import { Text } from "@webiny/admin-ui";

export const RowType = styled("div")`
    display: flex;
    align-items: center;
`;

export const RowIcon = styled("div")`
    margin-right: 8px;
    height: 24px;
`;

export const RowText = styled(Text)`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;
