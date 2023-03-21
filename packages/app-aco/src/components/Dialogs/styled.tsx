import styled from "@emotion/styled";
import { Dialog, DialogActions as DefaultDialogActions } from "@webiny/ui/Dialog";

export const DialogContainer = styled(Dialog)`
    .mdc-dialog__surface {
        width: 600px;
        min-width: 600px;
    }
`;

export const DialogActions = styled(DefaultDialogActions)`
    justify-content: space-between;
`;
