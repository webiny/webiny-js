import { useUi } from "@webiny/app/hooks/useUi";

interface UseDialogResponse {
    // TODO @ts-refactor
    showDialog: (message: string, options: Record<string, string>) => void;
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
