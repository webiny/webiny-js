import styled, { StyledComponent } from "@emotion/styled";
import { MenuProps, Menu as OriginalMenu } from "@webiny/ui/Menu";

export const Menu: StyledComponent<MenuProps> = styled(OriginalMenu)`
    .disabled {
        opacity: 0.5;
        pointer-events: none;
    }

    .mdc-deprecated-list-item__graphic {
        margin-right: 16px;
    }
`;
