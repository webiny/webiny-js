import React, { ReactNode, useState } from "react";

import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin";

import { Dialog } from "~/dialogs/Dialog";
import { GenericFormData } from "@webiny/form";

const t = i18n.ns("app-aco/contexts/dialogs");

interface ShowDialogParams {
    title: ReactNode;
    message: ReactNode;
    acceptLabel: ReactNode;
    cancelLabel: ReactNode;
    loadingLabel: ReactNode;
    onAccept?: Function;
    onClose?: Function;
}

export interface DialogsContext {
    showDialog: (params: ShowDialogParams) => void;
}

interface DialogsProviderProps {
    children: ReactNode;
}

interface State {
    title: ReactNode;
    message: ReactNode;
    acceptLabel: ReactNode;
    cancelLabel: ReactNode;
    loadingLabel: ReactNode;
    onAccept?: Function;
    onClose?: Function;
    open: boolean;
    loading: boolean;
}

export const initializeState = (): State => ({
    title: t`Confirmation`,
    message: undefined,
    acceptLabel: t`Confirm`,
    cancelLabel: t`Cancel`,
    loadingLabel: t`Loading`,
    onAccept: undefined,
    onClose: undefined,
    open: false,
    loading: false
});

export const Dialogs = React.createContext<DialogsContext | undefined>(undefined);

export const DialogsProvider: React.VFC<DialogsProviderProps> = ({ children }) => {
    const { showSnackbar } = useSnackbar();

    const [state, setState] = useState(initializeState());

    const showDialog = (params: ShowDialogParams) => {
        setState(state => ({
            ...state,
            ...params,
            open: true
        }));
    };

    const closeDialog = () => {
        if (typeof state.onClose === "function") {
            state.onClose();
        }

        setState(state => ({
            ...state,
            open: false
        }));
    };

    const onSubmit = async (data: GenericFormData) => {
        try {
            if (typeof state.onAccept === "function") {
                setState(state => ({
                    ...state,
                    loading: true
                }));

                await state.onAccept(data);

                setState(state => ({
                    ...state,
                    loading: false
                }));
            }

            closeDialog();
        } catch (error) {
            showSnackbar(error.message);
        }
    };

    const context = {
        showDialog,
        closeDialog
    };

    return (
        <Dialogs.Provider value={context}>
            {children}
            <Dialog
                title={state.title}
                message={state.message}
                open={state.open}
                acceptLabel={state.acceptLabel}
                cancelLabel={state.cancelLabel}
                loadingLabel={state.loadingLabel}
                loading={state.loading}
                closeDialog={closeDialog}
                onSubmit={onSubmit}
            />
        </Dialogs.Provider>
    );
};
