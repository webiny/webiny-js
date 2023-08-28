import styled from "@emotion/styled";
import { Drawer as RmwcDrawer } from "@webiny/ui/Drawer";

export const Drawer = styled(RmwcDrawer)`
    width: 60vw;
`;

export const HideEmptyCells = styled.div`
    .mdc-layout-grid__cell:empty {
        display: none;
    }
`;
