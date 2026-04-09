import { createContext, useContext } from "react";

export interface DialogParamsContextValue {
    params: Record<string, unknown>;
    closeDialog: () => void;
}

export const DialogParamsContext = createContext<DialogParamsContextValue | undefined>(undefined);

export const useDialogParamsContext = () => {
    const context = useContext(DialogParamsContext);

    if (!context) {
        throw new Error(
            "useDialog must be used inside a named dialog registered via AdminConfig.Dialog"
        );
    }

    return context;
};
