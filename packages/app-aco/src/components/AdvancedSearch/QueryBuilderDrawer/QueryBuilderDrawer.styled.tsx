import styled from "@emotion/styled";

import { IconButton } from "@webiny/ui/Button";
import { Drawer as RmwcDrawer } from "@webiny/ui/Drawer";

export const CloseButton = styled(IconButton)`
    position: absolute;
    top: 15px;
`;

export const DrawerContainer = styled(RmwcDrawer)`
    width: 1000px;
    /* Fix for the dir=rtl when a form is inside a drawer placed on the right side */
    .mdc-floating-label {
        transform-origin: left top !important;
        left: 16px !important;
        right: auto !important;
    }

    .mdc-select__dropdown-icon {
        left: auto !important;
        right: 8px !important;
    }

    .mdc-select__selected-text {
        padding-left: 16px !important;
        padding-right: 52px !important;
    }

    .mdc-switch__native-control {
        left: initial !important;
        right: 0 !important;
    }

    .mdc-switch__thumb-underlay {
        left: -18px;
    }

    .mdc-switch--checked .mdc-switch__thumb-underlay {
        transform: translateX(20px);
    }
`;
