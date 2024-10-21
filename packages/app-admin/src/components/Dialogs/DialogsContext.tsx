import React, { ReactNode, useState } from "react";
import { GenericFormData } from "@webiny/form";
import { useSnackbar } from "~/hooks";
import { Dialog } from "./Dialog";
import { CustomDialog } from "./CustomDialog";
import { createProvider } from "@webiny/app";

interface ShowDialogParams {
    title: ReactNode;
    content: ReactNode;
    actions?: JSX.Element;
    acceptLabel?: ReactNode;
    cancelLabel?: ReactNode;
    loadingLabel?: ReactNode;
    onAccept?: (data: GenericFormData) => void;
    onClose?: () => void;
}

interface ShowCustomDialogParams {
    element: JSX.Element;
    onSubmit?: (data: GenericFormData) => void;
}

export interface DialogsContext {
    showDialog: (params: ShowDialogParams) => void;
    showCustomDialog: (params: ShowCustomDialogParams) => void;
}

interface DialogsProviderProps {
    children: ReactNode;
}

interface State {
    open: boolean;
    loading: boolean;
    title: ReactNode;
    content: ReactNode;
    acceptLabel: ReactNode;
    cancelLabel: ReactNode;
    loadingLabel: ReactNode;
    element?: JSX.Element;
    onAccept?: (data: GenericFormData) => void;
    onClose?: () => void;
}

export const initializeState = (): State => ({
    title: `Confirmation`,
    content: undefined,
    acceptLabel: `Confirm`,
    cancelLabel: `Cancel`,
    loadingLabel: `Loading`,
    onAccept: undefined,
    onClose: undefined,
    open: false,
    loading: false
});

export const DialogsContext = React.createContext<DialogsContext | undefined>(undefined);

export const DialogsProvider = ({ children }: DialogsProviderProps) => {
    const { showSnackbar } = useSnackbar();

    const [state, setState] = useState(initializeState());

    const showDialog = (params: ShowDialogParams | JSX.Element) => {
        setState(state => ({
            ...state,
            ...params,
            open: true
        }));
    };

    const showCustomDialog = ({ onSubmit, element }: ShowCustomDialogParams) => {
        setState(state => ({
            ...state,
            element,
            onAccept: onSubmit,
            open: true
        }));
    };

    const closeDialog = () => {
        if (typeof state.onClose === "function") {
            state.onClose();
        }

        setState(state => ({
            ...state,
            open: false,
            element: undefined,
            content: null
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
            }
        } catch (error) {
            showSnackbar(error.message);
        } finally {
            setState(state => ({
                ...state,
                loading: false
            }));
            closeDialog();
        }
    };

    const context = {
        showDialog,
        showCustomDialog,
        closeDialog
    };

    return (
        <DialogsContext.Provider value={context}>
            {children}
            <>
                {state.element ? (
                    <CustomDialog
                        open={state.open}
                        loading={state.loading}
                        closeDialog={closeDialog}
                        onSubmit={onSubmit}
                    >
                        {state.element}
                    </CustomDialog>
                ) : null}
                {!state.element ? (
                    <Dialog
                        title={state.title}
                        content={state.content}
                        open={state.open}
                        acceptLabel={state.acceptLabel}
                        cancelLabel={state.cancelLabel}
                        loadingLabel={state.loadingLabel}
                        loading={state.loading}
                        closeDialog={closeDialog}
                        onSubmit={onSubmit}
                    />
                ) : null}
            </>
        </DialogsContext.Provider>
    );
};

interface DialogsProviderProps {
    children: React.ReactNode;
}

export const createDialogsProvider = () => {
    return createProvider(Component => {
        return function DialogsProviderDecorator({ children }: DialogsProviderProps) {
            return (
                <DialogsProvider>
                    <Component>{children}</Component>
                </DialogsProvider>
            );
        };
    });
};
