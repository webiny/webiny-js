import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { CenteredView, FormErrors } from "@webiny/app-admin";
import { Button, OverlayLoader } from "@webiny/admin-ui";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { SimpleFormHeader } from "@webiny/app-admin";
import { SimpleFormFooter } from "@webiny/app-admin";
import { SimpleFormContent } from "@webiny/app-admin";
import { SimpleForm } from "@webiny/app-admin";
import { useToast } from "@webiny/admin-ui";
import { BackgroundTaskSettingsPresenterFeature } from "../feature.js";
import { GetBackgroundTaskSettingsFeature } from "~/admin/features/getBackgroundTaskSettings/feature.js";
import { UpdateBackgroundTaskSettingsFeature } from "~/admin/features/updateBackgroundTaskSettings/feature.js";

const BackgroundTaskSettingsViewInner = observer(function BackgroundTaskSettingsViewInner() {
    const { presenter } = useFeature(BackgroundTaskSettingsPresenterFeature);
    const toast = useToast();

    useEffect(() => {
        void presenter.init();
    }, [presenter]);

    const { vm } = presenter;

    const handleSave = async () => {
        const success = await presenter.save();
        if (success) {
            toast.showSuccessToast({
                title: "Background task settings saved successfully!"
            });
        }
    };

    return (
        <CenteredView>
            <FormErrors form={vm.form} />
            <SimpleForm>
                {vm.loading ? <OverlayLoader text={"Loading settings..."} /> : null}
                {vm.saving ? <OverlayLoader text={"Saving settings..."} /> : null}
                <SimpleFormHeader title="Background Task Settings" />
                <SimpleFormContent>
                    <FormView name="BackgroundTaskSettings" form={vm.form} />
                </SimpleFormContent>
                <SimpleFormFooter>
                    <Button text={"Save settings"} onClick={handleSave} />
                </SimpleFormFooter>
            </SimpleForm>
        </CenteredView>
    );
});

export const BackgroundTaskSettingsView = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        GetBackgroundTaskSettingsFeature.register(child);
        UpdateBackgroundTaskSettingsFeature.register(child);
        BackgroundTaskSettingsPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <BackgroundTaskSettingsViewInner />
        </DiContainerProvider>
    );
};
