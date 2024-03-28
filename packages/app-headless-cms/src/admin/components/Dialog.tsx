import styled from "@emotion/styled";
import { Dialog as BaseDialog } from "@webiny/ui/Dialog";
export * from "@webiny/ui/Dialog";

export const Dialog = styled(BaseDialog)`
    .mdc-dialog__surface {
        width: 600px;
        min-width: 600px;
        overflow: initial;
    }

    .mdc-dialog__content {
        overflow: auto;
        .mdc-deprecated-list:first-of-type {
            padding: 0;
        }
    }
`;
