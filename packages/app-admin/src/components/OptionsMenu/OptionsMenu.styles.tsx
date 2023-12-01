import styled from "@emotion/styled";
import { Menu as OriginalMenu } from "@webiny/ui/Menu";

export const Menu = styled(OriginalMenu)`
    width: 250px;
    right: -105px;
    left: auto !important;

    .disabled {
        opacity: 0.5;
        pointer-events: none;
    }
`;
