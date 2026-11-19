import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Alert, Button, OverlayLoader, useToast } from "@webiny/admin-ui";
import {
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader
} from "@webiny/app-admin";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { useFeature } from "@webiny/app";
import { SmtpSettingsPresenterFeature } from "../feature.js";

export const SmtpSettingsView = observer(function SmtpSettingsView() {
    const toast = useToast();
    const { presenter } = useFeature(SmtpSettingsPresenterFeature);
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

    let saveButton: React.ReactNode = null;
    if (vm.editable) {
        saveButton = <Button text={"Save"} onClick={handleSave} disabled={vm.testMailSending} />;
    }

    return (
        <SimpleForm>
            {(vm.loading || vm.saving) && <OverlayLoader />}
            <SimpleFormHeader title="SMTP Settings" />
            <SimpleFormContent>
                {vm.source === "code" ? (
                    <Alert title="Managed by code" type="info">
                        SMTP settings are managed by code. Edit <code>webiny.config.tsx</code> to
                        change them.
                    </Alert>
                ) : null}
                <FormView name={"SMTP Settings"} form={vm.form} />
            </SimpleFormContent>
            <SimpleFormFooter>{saveButton}</SimpleFormFooter>
        </SimpleForm>
    );
});
