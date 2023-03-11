import styled from "@emotion/styled";
import { Dialog, DialogActions as DefaultDialogActions } from "@webiny/ui/Dialog";

export const DialogContainer = styled(Dialog)`
    .mdc-dialog__surface {
        width: 600px;
        min-width: 600px;
        overflow: initial;
    }

    .mdc-dialog__content {
        overflow: initial !important;
    }
`;

export const DialogActions = styled(DefaultDialogActions)`
    justify-content: space-between;
`;

export const DialogFoldersContainer = styled("div")`
    max-height: 30vh;
    overflow-y: scroll;
    margin-top: 8px;
    padding: 8px;
    background: var(--mdc-theme-background);
`;
