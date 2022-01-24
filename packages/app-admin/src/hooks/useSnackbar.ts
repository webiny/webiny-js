import React from "react";
import { useUi } from "@webiny/app/hooks/useUi";

interface UseSnackbarResponse {
    showSnackbar: (message: React.ReactNode, options?: Record<string, string>) => void;
    hideSnackbar: () => void;
}
export const useSnackbar = (): UseSnackbarResponse => {
    const ui = useUi();

    return {
        showSnackbar: (message, options = {}) => {
            ui.setState(ui => {
                return { ...ui, snackbar: { message, options } };
            });
        },
        hideSnackbar: () => {
            ui.setState(ui => {
                return { ...ui, snackbar: null };
            });
        }
    };
};
