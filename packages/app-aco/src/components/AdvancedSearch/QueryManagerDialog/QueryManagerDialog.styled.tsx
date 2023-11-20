import styled from "@emotion/styled";
import { Dialog } from "@webiny/ui/Dialog";

export const DialogContainer = styled(Dialog)`
    z-index: 22;
    .mdc-dialog__surface {
        width: 600px;
        min-width: 600px;
    }
`;

export const ListActions = styled("div")`
    display: flex;
`;

export const EmptyContainer = styled("div")`
    padding: 24px 0;
`;

export const EmptyIconContainer = styled("div")`
    padding: 24px;
    background: var(--mdc-theme-background);
    width: 75px;
    height: 75px;
    border-radius: 50%;
`;
