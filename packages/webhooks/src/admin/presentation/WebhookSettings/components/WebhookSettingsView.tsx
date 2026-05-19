import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { FormErrors } from "@webiny/app-admin";
import { Button, Heading, OverlayLoader, Separator } from "@webiny/admin-ui";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { WebhookSettingsPresenterFeature } from "../feature.js";
import { GetWebhookSettingsFeature } from "~/admin/features/getWebhookSettings/feature.js";
import { UpdateWebhookSettingsFeature } from "~/admin/features/updateWebhookSettings/feature.js";

const WebhookSettingsViewInner = observer(function WebhookSettingsViewInner() {
    const { presenter } = useFeature(WebhookSettingsPresenterFeature);

    useEffect(() => {
        void presenter.init();
    }, [presenter]);

    const { vm, actions } = presenter;

    if (vm.loading) {
        return <OverlayLoader />;
    }

    return (
        <div className="flex flex-col h-main-content">
            <div className="flex items-center justify-between py-sm px-md">
                <Heading level={5}>Webhook Settings</Heading>
                <div className="flex gap-sm">
                    <Button
                        variant="primary"
                        onClick={() => void actions.save()}
                        disabled={vm.saving}
                    >
                        {vm.saving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </div>
            <Separator />
            <div className="p-lg">
                <FormErrors form={vm.form} />
                <FormView name="WebhookSettings" form={vm.form} />
            </div>
        </div>
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
