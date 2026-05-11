import styled from "@emotion/styled";
import { Dialog as AdminUiDialog, type DialogProps } from "@webiny/admin-ui";

export type { DialogProps };
export type DialogOnClose = DialogProps["onClose"];

export const Dialog = styled(AdminUiDialog)``;
