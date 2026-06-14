import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Alert, Button, OverlayLoader, useToast } from "@webiny/admin-ui";
import {
    CenteredView,
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader
} from "@webiny/app-admin";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { useFeature } from "@webiny/app";
import { SettingsPresenterFeature } from "../feature.js";

export const SettingsView = observer(function SettingsView() {
    const toast = useToast();
    const { presenter } = useFeature(SettingsPresenterFeature);
    const { vm } = presenter;

    useEffect(() => {
        void presenter.load();
    }, [presenter]);

    const handleSave = async () => {
        try {
            const success = await presenter.save();
            if (success) {
                toast.showSuccessToast({ title: "Settings updated successfully!" });
            }
        } catch (e) {
            toast.showWarningToast({ title: e.message });
        }
    };

    return (
        <CenteredView>
            <SimpleForm>
                {(vm.loading || vm.saving) && <OverlayLoader />}
                <SimpleFormHeader title="Mailer Settings" />
                <SimpleFormContent>
                    {vm.source === "code" ? (
                        <Alert title="Managed by code" type="info">
                            Mailer settings are managed by code. Edit <code>webiny.config.tsx</code>{" "}
                            to change them.
                        </Alert>
                    ) : null}
                    <FormView name={"Mailer Settings"} form={vm.form} />
                </SimpleFormContent>
                <SimpleFormFooter>
                    {vm.editable ? <Button text={"Save"} onClick={handleSave} /> : null}
                </SimpleFormFooter>
            </SimpleForm>
        </CenteredView>
    );
});
