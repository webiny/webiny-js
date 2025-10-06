import type { ReactNode } from "react";
import React, { useState } from "react";
import type { GenericFormData } from "@webiny/form";
import { useSnackbar } from "~/hooks/index.js";
import { Dialog, type DialogProps } from "./Dialog.js";
import { CustomDialog } from "./CustomDialog.js";
import { createProvider } from "@webiny/app";
import { generateId } from "@webiny/utils";

interface ShowDialogParams {
    title: ReactNode;
    description?: ReactNode;
    dismissible?: boolean;
    content: ReactNode;
    actions?: JSX.Element;
    icon?: JSX.Element;
    acceptLabel?: ReactNode;
    cancelLabel?: ReactNode;
    loadingLabel?: ReactNode;
    dataLoadingLabel?: ReactNode;
    onAccept?: (data: GenericFormData) => void;
    onClose?: () => void;
    formData?: DialogProps["formData"];
    size?: "sm" | "md" | "lg" | "xl" | "full";
}

interface ShowCustomDialogParams {
    element: JSX.Element;
    onSubmit?: (data: GenericFormData) => void;
}

export interface DialogsContext {
    showDialog: (params: ShowDialogParams) => () => void;
    showCustomDialog: (params: ShowCustomDialogParams) => () => void;
    closeAllDialogs: () => void;
}

interface DialogsProviderProps {
    children: ReactNode;
}

interface DialogState extends ShowDialogParams {
    id: string;
    open: boolean;
    loading: boolean;
    element?: JSX.Element;
}

export const initializeState = (params: Partial<DialogState> = {}): DialogState => ({
    id: `dialog-${generateId()}`,
    title: params.title ?? `Confirmation`,
    description: params.description,
    dismissible: params.dismissible,
    icon: params.icon,
    content: params.content,
    acceptLabel: params.acceptLabel === null ? null : (params.acceptLabel ?? `Confirm`),
    cancelLabel: params.cancelLabel === null ? null : (params.cancelLabel ?? `Cancel`),
    loadingLabel: params.loadingLabel ?? `Loading...`,
    dataLoadingLabel: params.dataLoadingLabel ?? `Loading...`,
    onAccept: params.onAccept,
    onClose: params.onClose,
    open: params.open ?? false,
    loading: params.loading ?? false,
    element: params.element,
    formData: params.formData ?? {},
    size: params.size ?? "md"
});

export const DialogsContext = React.createContext<DialogsContext | undefined>(undefined);

export const DialogsProvider = ({ children }: DialogsProviderProps) => {
    const { showSnackbar } = useSnackbar();
    const [dialogs, setDialogs] = useState<Map<string, DialogState>>(new Map());

    const showDialog = (params: ShowDialogParams) => {
        const newDialog = initializeState({ ...params, open: true });
        setDialogs(dialogs => new Map(dialogs).set(newDialog.id, newDialog));
        return () => closeDialog(newDialog.id);
    };

    const showCustomDialog = ({ onSubmit, element }: ShowCustomDialogParams) => {
        const newDialog = initializeState({
            element,
            onAccept: onSubmit,
            open: true
        });
        setDialogs(dialogs => new Map(dialogs).set(newDialog.id, newDialog));
        return () => closeDialog(newDialog.id);
    };

    const closeDialog = (id: string) => {
        const dialog = dialogs.get(id);

        // Call the onClose callback if it exists
        if (dialog?.onClose && typeof dialog.onClose === "function") {
            try {
                dialog.onClose();
            } catch (error) {
                // Log error but don't prevent dialog cleanup
                console.error("Error in dialog onClose callback:", error);
            }
        }

        setDialogs(dialogs => {
            const newDialogs = new Map(dialogs);
            newDialogs.delete(id);
            return newDialogs;
        });
    };

    const closeAllDialogs = () => {
        setDialogs(new Map());
    };

    const onSubmit = async (id: string, data: GenericFormData) => {
        const dialog = dialogs.get(id);
        if (!dialog) {
            return;
        }

        try {
            if (typeof dialog.onAccept === "function") {
                setDialogs(dialogs => {
                    const newDialogs = new Map(dialogs);
                    newDialogs.set(id, { ...dialog, loading: true });
                    return newDialogs;
                });

                await dialog.onAccept(data);
            }
        } catch (error) {
            showSnackbar(error.message);
        } finally {
            setDialogs(dialogs => {
                const newDialogs = new Map(dialogs);
                newDialogs.set(id, { ...dialog, loading: false });
                return newDialogs;
            });
            closeDialog(id);
        }
    };

    const context = {
        showDialog,
        showCustomDialog,
        closeDialog,
        closeAllDialogs
    };

    return (
        <DialogsContext.Provider value={context}>
            {children}
            {Array.from(dialogs.values()).map(dialog =>
                dialog.element ? (
                    <CustomDialog
                        key={dialog.id}
                        open={dialog.open}
                        loading={dialog.loading}
                        closeDialog={() => closeDialog(dialog.id)}
                        onSubmit={data => onSubmit(dialog.id, data)}
                    >
                        {dialog.element}
                    </CustomDialog>
                ) : (
                    <Dialog
                        key={dialog.id}
                        description={dialog.description}
                        dismissible={dialog.dismissible ?? true}
                        icon={dialog.icon ?? <></>}
                        title={dialog.title}
                        content={dialog.content}
                        open={dialog.open}
                        acceptLabel={dialog.acceptLabel}
                        cancelLabel={dialog.cancelLabel}
                        loadingLabel={dialog.loadingLabel}
                        dataLoadingLabel={dialog.dataLoadingLabel}
                        loading={dialog.loading}
                        closeDialog={() => {
                            closeDialog(dialog.id);
                            dialog.onClose && dialog.onClose();
                        }}
                        onSubmit={data => onSubmit(dialog.id, data)}
                        formData={dialog.formData}
                        size={dialog.size}
                    />
                )
            )}
        </DialogsContext.Provider>
    );
};

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
