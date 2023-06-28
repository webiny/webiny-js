import styled from "@emotion/styled";
import { IconButton as OriginalIconButton } from "@webiny/ui/Button";
import { Menu as OriginalMenu } from "@webiny/ui/Menu";

export const IconButton = styled(OriginalIconButton)`
    margin-left: 8px;
`;

export const Menu = styled(OriginalMenu)`
    width: 250px;
    right: -105px;
    left: auto !important;

    .disabled {
        opacity: 0.5;
        pointer-events: none;
    }
`;
