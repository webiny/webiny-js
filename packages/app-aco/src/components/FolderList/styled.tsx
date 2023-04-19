import styled from "@emotion/styled";
import { css } from "emotion";

import { ListItemGraphic as ListItemGraphicBase } from "@webiny/ui/List";

export const List = styled("div")`
    width: 100%;
    display: grid;
    /* define the number of grid columns */
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    column-gap: 16px;
    row-gap: 16px;
`;
