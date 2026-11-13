import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { CenteredView, FormErrors, useFieldRenderers } from "@webiny/app-admin";
import { Alert, Button, OverlayLoader } from "@webiny/admin-ui";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { SimpleFormHeader } from "@webiny/app-admin";
import { SimpleFormFooter } from "@webiny/app-admin";
import { SimpleFormContent } from "@webiny/app-admin";
import { SimpleForm } from "@webiny/app-admin";
import { useToast } from "@webiny/admin-ui";
import { WebhookSettingsPresenterFeature } from "../feature.js";
import { GetWebhookSettingsFeature } from "~/admin/features/getWebhookSettings/feature.js";
import { UpdateWebhookSettingsFeature } from "~/admin/features/updateWebhookSettings/feature.js";
import { SigningSecretActions } from "~/admin/presentation/SigningSecret/SigningSecretActions.js";

const SettingsSigningSecretActions = () => {
    const { presenter } = useFeature(WebhookSettingsPresenterFeature);
    return (
        <SigningSecretActions
            getValue={() => presenter.getSigningSecret()}
            onGenerate={() => presenter.generateSigningSecret()}
        />
    );
};

const WebhookSettingsViewInner = observer(function WebhookSettingsViewInner() {
    const { presenter } = useFeature(WebhookSettingsPresenterFeature);
    const toast = useToast();
    const defaultRenderers = useFieldRenderers();

    const renderers = useMemo(() => {
        return {
            ...defaultRenderers,
            "element:signingSecretActions": SettingsSigningSecretActions
        };
    }, [defaultRenderers]);

    useEffect(() => {
        void presenter.init();
    }, [presenter]);

    const { vm } = presenter;

    const handleSave = async () => {
        const success = await presenter.save();
        if (success) {
            toast.showSuccessToast({
                title: "Webhooks settings saved successfully!"
            });
        }
    };

    if (vm.error) {
        return (
            <CenteredView>
                <Alert type="danger">Webhook settings are not available: {vm.error}</Alert>
            </CenteredView>
        );
    }

    return (
        <CenteredView>
            <FormErrors form={vm.form} />
            <SimpleForm>
                {vm.loading ? <OverlayLoader text={"Loading settings..."} /> : null}
                {vm.saving ? <OverlayLoader text={"Saving settings..."} /> : null}
                <SimpleFormHeader title="Webhooks Settings" />
                <SimpleFormContent>
                    <FormView name="WebhooksSettings" form={vm.form} renderers={renderers} />
                </SimpleFormContent>
                <SimpleFormFooter>
                    <Button text={"Save settings"} onClick={handleSave} />
                </SimpleFormFooter>
            </SimpleForm>
        </CenteredView>
    );
});

export const WebhookSettingsView = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        GetWebhookSettingsFeature.register(child);
        UpdateWebhookSettingsFeature.register(child);
        WebhookSettingsPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <WebhookSettingsViewInner />
        </DiContainerProvider>
    );
};
