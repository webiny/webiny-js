import styled from "@emotion/styled";
import { Dialog as BaseDialog } from "~/admin/components/Dialog";

export const Dialog = styled(BaseDialog)({
    minWidth: "800px",
    ".mdc-dialog__surface": {
        width: "auto",
        minWidth: "800px",
        maxHeight: "calc(100vh - 100px)"
    }
});

export const FullWidthDialog = styled(BaseDialog)({
    maxWidth: "100%",
    minWidth: "90%",
    zIndex: "20",
    ".mdc-dialog__surface": {
        width: "auto",
        maxWidth: "100%",
        minWidth: "90%",
        maxHeight: "calc(100vh - 100px)"
    }
});
