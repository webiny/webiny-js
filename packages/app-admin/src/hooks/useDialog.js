// @flow
import { useUi } from "@webiny/app/components";

const useDialog = () => {
    const ui = useUi();
    return {
        showDialog: (message, options) => {
            ui.setState(ui => {
                return { ...ui, dialog: { message, options } };
            });
        }
    };
};

export { useDialog };
