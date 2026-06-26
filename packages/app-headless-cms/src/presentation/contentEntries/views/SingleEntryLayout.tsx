import React from "react";
import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm/SimpleForm.js";
import { Button, OverlayLoader, useToast } from "@webiny/admin-ui";
import { FormErrors } from "@webiny/app-admin";
import type { ISingleEntryPresenter } from "../singleEntry/abstractions.js";
import { SingleEntryFormContent } from "./SingleEntryFormContent.js";

interface SingleEntryLayoutProps {
    presenter: ISingleEntryPresenter;
    modelName: string;
}

export const SingleEntryLayout = observer(({ presenter, modelName }: SingleEntryLayoutProps) => {
    const toast = useToast();
    const { vm } = presenter;

    const handleSave = useCallback(async () => {
        const success = await presenter.save();
        if (success) {
            toast.showSuccessToast({
                title: `${modelName} saved successfully!`
            });
        }
    }, [presenter, modelName]);

    if (!vm.form) {
        if (vm.loading) {
            return <OverlayLoader text={vm.loading} />;
        }
        return null;
    }

    return (
        <SingleEntryFormContent>
            <SimpleForm size={"lg"}>
                <FormErrors form={vm.form} className={"mb-md"} />
                <SimpleFormHeader title={modelName}>
                    <div className={"flex justify-end"}>
                        {vm.canSave ? (
                            <Button
                                text="Save"
                                onClick={handleSave}
                                disabled={vm.loading !== null}
                            />
                        ) : null}
                    </div>
                </SimpleFormHeader>
                <SimpleFormContent
                    className={"border-sm border-t-none border-neutral-dimmed-darker rounded-b-3xl"}
                >
                    {vm.loading ? <OverlayLoader text={vm.loading} /> : null}
                    <FormView name="SingleEntryForm" form={vm.form} />
                </SimpleFormContent>
            </SimpleForm>
        </SingleEntryFormContent>
    );
});
