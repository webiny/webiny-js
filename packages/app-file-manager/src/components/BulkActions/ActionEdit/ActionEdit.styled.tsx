import styled from "@emotion/styled";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/round/add.svg";
import { Dialog } from "@webiny/ui/Dialog";

export const ActionEditFormContainer = styled.div`
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

interface ButtonIconProps {
    disabled?: boolean;
}

export const ButtonIcon = styled(AddIcon)<ButtonIconProps>`
    fill: ${props =>
        props.disabled ? "var(--mdc-theme-text-hint-on-light)" : "var(--mdc-theme-primary)"};
    width: 18px;
    margin-right: 8px;
`;
