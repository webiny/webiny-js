import styled from "@emotion/styled";
import { css } from "emotion";
import { ListItemGraphic as ListItemGraphicBase } from "@webiny/ui/List";
import { Typography } from "@webiny/ui/Typography";

export const RowTitle = styled("div")`
    display: flex;
    align-items: center;
    cursor: pointer;
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

export const ListItemGraphic = styled(ListItemGraphicBase)`
    margin-right: 25px;
`;

export const menuStyles = css(`
    width: 200px;
`);

export const actionsColumnStyles = css(`
    max-width: 80px!important;
`);
