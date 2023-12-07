import React, { ReactNode } from "react";

import { Form, FormOnSubmit, GenericFormData } from "@webiny/form";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { DialogActions, DialogContent, DialogTitle } from "@webiny/ui/Dialog";
import { CircularProgress } from "@webiny/ui/Progress";

import { DialogContainer } from "./styled";

interface DialogProps {
    title: ReactNode;
    message: ReactNode;
    acceptLabel: ReactNode;
    cancelLabel: ReactNode;
    loadingLabel: ReactNode;
    onSubmit: (data: GenericFormData) => void;
    closeDialog: () => void;
    loading: boolean;
    open: boolean;
}

export const Dialog = ({
    open,
    loading,
    title,
    message,
    acceptLabel,
    cancelLabel,
    loadingLabel,
    closeDialog,
    onSubmit
}: DialogProps) => {
    const handleSubmit: FormOnSubmit = data => {
        onSubmit(data);
    };

    return (
        <DialogContainer open={open} onClose={closeDialog}>
            {open ? (
                <Form onSubmit={handleSubmit}>
                    {({ submit }) => (
                        <>
                            <DialogTitle>{title}</DialogTitle>
                            {loading && <CircularProgress label={loadingLabel} />}
                            <DialogContent>{message}</DialogContent>
                            <DialogActions>
                                <ButtonDefault onClick={closeDialog}>{cancelLabel}</ButtonDefault>
                                <ButtonPrimary onClick={submit}>{acceptLabel}</ButtonPrimary>
                            </DialogActions>
                        </>
                    )}
                </Form>
            ) : null}
        </DialogContainer>
    );
};
