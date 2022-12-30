import styled from "@emotion/styled";
import { Drawer } from "@webiny/ui/Drawer";

export const Content = styled(Drawer)`
    width: 60vw;

    /**
     * Fixing list items display inside the drawer with dir="rtl"
     */
    .mdc-list-item__graphic {
        margin-left: 0 !important;
        margin-right: 32px !important;
    }

    .mdc-list-item__meta {
        margin-left: auto !important;
        margin-right: 0 !important;
    }
`;
