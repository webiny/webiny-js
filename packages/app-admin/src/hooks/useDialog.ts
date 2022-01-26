import React from "react";
import { useUi } from "@webiny/app/hooks/useUi";

// TODO @ts-refactor
interface UseDialogResponseShowDialogOptions {
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
