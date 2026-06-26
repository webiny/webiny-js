import React, { useCallback, useState } from "react";
import { Dialog } from "@webiny/admin-ui";

export interface ConfirmationDialogProps {
    title: React.ReactNode;
    children: React.ReactNode;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    loadingLabel?: string;
}

export const ConfirmationDialog = ({
    title,
    children,
    onConfirm,
    onCancel,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    loadingLabel = "Processing..."
}: ConfirmationDialogProps) => {
    const [loading, setLoading] = useState(false);

    const handleConfirm = useCallback(async () => {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
        }
    }, [onConfirm]);

    const handleCancel = useCallback(() => {
        onCancel();
    }, [onCancel]);

    return (
        <Dialog
            open
            onOpenChange={open => {
                if (!open && !loading) {
                    handleCancel();
                }
            }}
            title={title}
            loading={loading ? { text: loadingLabel } : false}
            dismissible={!loading}
            actions={
                <>
                    <Dialog.CancelAction onClick={handleCancel} text={cancelLabel} />
                    <Dialog.ConfirmAction onClick={handleConfirm} text={confirmLabel} />
                </>
            }
        >
            {children}
        </Dialog>
    );
};
