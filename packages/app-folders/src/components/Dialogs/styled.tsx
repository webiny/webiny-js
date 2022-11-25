import styled from "@emotion/styled";
import { Dialog, DialogActions } from "@webiny/ui/Dialog";

export const CreateDialogContainer = styled(Dialog)`
    .mdc-dialog__surface {
        width: 600px;
        min-width: 600px;
        overflow: initial;
    }

    .mdc-dialog__content {
        overflow: initial !important;
    }
`;

export const CreateDialogActions = styled(DialogActions)`
    justify-content: space-between;
`;
