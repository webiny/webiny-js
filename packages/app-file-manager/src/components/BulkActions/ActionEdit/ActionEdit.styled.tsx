import styled from "@emotion/styled";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/round/add.svg";
import { Dialog } from "@webiny/ui/Dialog";

export const ActionEditFormContainer = styled("div")`
    margin: -24px !important;
`;

export const DialogContainer = styled(Dialog)`
    z-index: 22;

    .mdc-dialog__surface {
        width: 800px;
        min-width: 800px;
    }
`;

export const BatchEditorContainer = styled.div`
    padding: 24px;
`;

export const AddOperationInner = styled.div`
    padding: 24px 0 0;
    text-align: center;
`;

export const ButtonIcon = styled(AddIcon)`
    fill: var(--mdc-theme-primary);
    width: 18px;
    margin-right: 8px;
`;

export const AccordionItemInner = styled.div`
    position: relative;
`;
