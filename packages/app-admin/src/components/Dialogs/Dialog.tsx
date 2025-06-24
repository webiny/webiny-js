import React, { ReactNode } from "react";
import { Dialog as AdminDialog, OverlayLoader } from "@webiny/admin-ui";
import { Form, FormOnSubmit, GenericFormData } from "@webiny/form";

interface DialogProps {
    title: ReactNode;
    content: ReactNode;
    acceptLabel?: ReactNode;
    cancelLabel?: ReactNode;
    loadingLabel?: ReactNode;
    onSubmit: (data: GenericFormData) => void;
    closeDialog: () => void;
    loading: boolean;
    open: boolean;
    formData?: GenericFormData;
    size?: "sm" | "md" | "lg" | "xl" | "full";
}

export const Dialog = ({
    open,
    loading,
    title,
    content,
    acceptLabel,
    cancelLabel,
    loadingLabel = "Loading...",
    closeDialog,
    onSubmit,
    formData,
    size
}: DialogProps) => {
    const handleSubmit: FormOnSubmit = data => {
        onSubmit(data);
    };

    return (
        <Form onSubmit={handleSubmit} data={formData}>
            {({ submit }) => (
                <AdminDialog
                    open={open}
                    onClose={closeDialog}
                    size={size}
                    title={title}
                    actions={
                        <>
                            {cancelLabel ? (
                                <AdminDialog.CancelButton
                                    onClick={closeDialog}
                                    text={cancelLabel}
                                />
                            ) : null}
                            {acceptLabel ? (
                                <AdminDialog.ConfirmButton onClick={submit} text={acceptLabel} />
                            ) : null}
                        </>
                    }
                >
                    {open ? (
                        <>
                            {loading && <OverlayLoader text={loadingLabel} />}
                            {content}
                        </>
                    ) : null}
                </AdminDialog>
            )}
        </Form>
    );
};
