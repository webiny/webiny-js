import styled from "@emotion/styled";

import { Drawer as RmwcDrawer } from "@webiny/ui/Drawer";
import { IconButton } from "@webiny/ui/Button";

export const CloseButton = styled(IconButton)`
    position: absolute;
    top: 15px;
`;

export const DrawerContainer = styled(RmwcDrawer)`
    width: 50vw;
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
`;

interface PossibleHiddenFieldProps {
    hidden: boolean;
}

export const PossibleHiddenField = styled("div")<PossibleHiddenFieldProps>`
    display: ${props => (props.hidden ? "none" : "visible")};
`;
