import React, { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent, FormView, useRouter } from "@webiny/app-admin";
import { Dialog, OverlayLoader } from "@webiny/admin-ui";
import { Routes } from "~/routes.js";
import { CreateLayoutDialogFeature } from "./feature.js";

interface CreateLayoutDialogProps {
    onClose: () => void;
}

export const CreateLayoutDialog = createReactiveComponent(
    ({ onClose }: CreateLayoutDialogProps) => {
        const { presenter } = useFeature(CreateLayoutDialogFeature);
        const { goToRoute } = useRouter();
        const { form, loading } = presenter.vm;

        useEffect(() => {
            presenter.init();
        }, [presenter]);

        const handleSubmit = async () => {
            const layout = await presenter.submit();
            if (!layout) {
                return;
            }

            onClose();
            goToRoute(Routes.Layouts.Editor, { id: layout.id });
        };

        return (
            <Dialog
                open={true}
                onClose={onClose}
                title={"New layout"}
                description={
                    "It starts with the Main content placeholder: build the layout around it."
                }
                actions={
                    <>
                        <Dialog.CancelAction onClick={onClose} text={"Cancel"} />
                        <Dialog.ConfirmAction onClick={handleSubmit} text={"Create"} />
                    </>
                }
            >
                {loading ? <OverlayLoader text={"Creating layout..."} /> : null}
                {form ? <FormView name={"Create Layout"} form={form} /> : null}
            </Dialog>
        );
    }
);
