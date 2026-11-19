import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { OverlayLoader } from "@webiny/admin-ui";
import { useToast } from "@webiny/admin-ui";
import { SimpleForm } from "@webiny/app-admin";
import { SimpleFormContent } from "@webiny/app-admin";
import { SimpleFormFooter } from "@webiny/app-admin";
import { SimpleFormHeader } from "@webiny/app-admin";
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

    let codeManagedAlert: React.ReactNode = null;
    if (vm.source === "code") {
        codeManagedAlert = (
            <Alert title="Managed by code" type="info">
                SMTP settings are managed by code. Edit <code>webiny.config.tsx</code> to change
                them.
            </Alert>
        );
    }

    return (
        <SimpleForm>
            {(vm.loading || vm.saving) && <OverlayLoader />}
            <SimpleFormHeader title="SMTP Settings" />
            <SimpleFormContent>
                {codeManagedAlert}
                <FormView name={"SMTP Settings"} form={vm.form} />
            </SimpleFormContent>
            <SimpleFormFooter>{saveButton}</SimpleFormFooter>
        </SimpleForm>
    );
});
