// @flow
import { useUi } from "@webiny/app/hooks/useUi";

export const useSnackbar = () => {
    const ui = useUi();

    return {
        showSnackbar: (message, options) => {
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
