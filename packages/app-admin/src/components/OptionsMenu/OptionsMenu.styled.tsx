import styled from "@emotion/styled";
import { Menu as OriginalMenu } from "@webiny/ui/Menu";

export const Menu = styled(OriginalMenu)`
    .disabled {
        opacity: 0.5;
        pointer-events: none;
    }

    .mdc-list-item__graphic {
        margin-right: 16px;
    }
`;
