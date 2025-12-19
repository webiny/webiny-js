import type { ReactNode } from "react";
import React, { useEffect, useState } from "react";
import { Dialog as AdminDialog, OverlayLoader } from "@webiny/admin-ui";
import type { FormOnSubmit, GenericFormData } from "@webiny/form";
import { Form } from "@webiny/form";

export interface DialogProps {
    title: ReactNode;
    description: ReactNode;
    dismissible: boolean;
    content: ReactNode;
    icon: ReactNode;
    acceptLabel?: ReactNode;
    cancelLabel?: ReactNode;
    loadingLabel?: ReactNode;
    dataLoadingLabel?: ReactNode;
    onSubmit: (data: GenericFormData) => void;
    closeDialog: () => void;
    loading: boolean;
    open: boolean;
    formData?: GenericFormData | (() => Promise<GenericFormData>);
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
    dataLoadingLabel = "Loading...",
    closeDialog,
    onSubmit,
    size,
    ...props
}: DialogProps) => {
    const handleSubmit: FormOnSubmit = data => {
        return onSubmit(data);
    };

    const [dataIsLoading, setDataIsLoading] = useState(false);

    const [formData, setFormData] = useState<GenericFormData | undefined>(
        typeof props.formData === "function" ? undefined : props.formData
    );

    useEffect(() => {
        if (typeof props.formData === "function") {
            setDataIsLoading(true);
            props.formData().then((data: GenericFormData) => {
                setFormData(data);
                setDataIsLoading(false);
            });
        }
    }, [props.formData]);

    return (
        <Form onSubmit={handleSubmit} data={formData}>
            {({ submit }) => (
                <AdminDialog
                    open={open}
                    onClose={closeDialog}
                    size={size}
                    title={title}
                    description={props.description}
                    icon={<AdminDialog.Icon icon={props.icon} label={""} />}
                    dismissible={props.dismissible}
                    actions={
                        <>
                            {cancelLabel ? (
                                <AdminDialog.CancelAction
                                    onClick={closeDialog}
                                    text={cancelLabel}
                                />
                            ) : null}
                            {acceptLabel ? (
                                <AdminDialog.ConfirmAction onClick={submit} text={acceptLabel} />
                            ) : null}
                        </>
                    }
                >
                    {open ? (
                        <>
                            {loading && <OverlayLoader text={loadingLabel} />}
                            {dataIsLoading && <OverlayLoader text={dataLoadingLabel} />}
                            {content}
                        </>
                    ) : null}
                </AdminDialog>
            )}
        </Form>
    );
};
