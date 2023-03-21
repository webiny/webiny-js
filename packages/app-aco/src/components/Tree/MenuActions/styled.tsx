import styled from "@emotion/styled";
import { ListItemGraphic as ListItemGraphicBase } from "@webiny/ui/List";

export const Container = styled("div")`
    position: absolute;
    right: 8px;
    visibility: hidden;
    cursor: pointer;
`;

export const ListItemGraphic = styled(ListItemGraphicBase)`
    margin-right: 8px;
`;
