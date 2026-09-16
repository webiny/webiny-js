import styled from "@emotion/styled";
import { Text } from "@webiny/admin-ui";

export const RowTitle = styled("div")`
    display: flex;
    align-items: center;
`;

export const RowIcon = styled("div")`
    margin-right: 8px;
    display: flex;
    align-items: center;
`;

export const RowText = styled(Text)`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;
