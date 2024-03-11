import React from "react";
import { useUi } from "@webiny/app/hooks/useUi";

interface AcceptAction {
    label: string;
    onClick?: () => void;
}
interface CancelAction {
    label: string;
    onClick?: () => void;
}

export interface UseDialogResponseShowDialogOptions {
    dataTestId?: string;
    title: string;
    loading?: boolean;
    actions?: {
        accept?: AcceptAction;
        cancel?: CancelAction;
    };
    style?: {
        [key: string]: any;
    };
    onClose?: () => void;
    [key: string]: any;
}
interface UseDialogResponse {
    showDialog: (message: React.ReactNode, options?: UseDialogResponseShowDialogOptions) => void;
    hideDialog: () => void;
}
const useDialog = (): UseDialogResponse => {
    const ui = useUi();
    return {
        showDialog: (message, options) => {
            ui.setState(ui => {
                return { ...ui, dialog: { message, options } };
            });
        },
        hideDialog: () => {
            ui.setState(ui => {
                return { ...ui, dialog: null };
            });
        }
    };
};

export { useDialog };
