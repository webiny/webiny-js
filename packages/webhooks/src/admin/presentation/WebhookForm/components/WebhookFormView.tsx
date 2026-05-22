import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature, useRoute } from "@webiny/app";
import { FormErrors, useRouter, useFieldRenderers } from "@webiny/app-admin";
import { Button, Heading, OverlayLoader, Separator } from "@webiny/admin-ui";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { WebhookFormPresenterFeature } from "../feature.js";
import { GetWebhookFeature } from "~/admin/features/getWebhook/feature.js";
import { CreateWebhookFeature } from "~/admin/features/createWebhook/feature.js";
import { UpdateWebhookFeature } from "~/admin/features/updateWebhook/feature.js";
import { DeleteWebhookFeature } from "~/admin/features/deleteWebhook/feature.js";
import { ListAvailableEventsFeature } from "~/admin/features/listAvailableEvents/feature.js";
import { WebhookPermissionsFeature } from "~/admin/features/permissions/feature.js";
import { Routes } from "~/admin/routes.js";
import { SigningSecret } from "./SigningSecret.js";
import { WebhookDeliveriesDrawer } from "~/admin/presentation/WebhookDeliveries/components/WebhookDeliveriesDrawer.js";

const SectionHeading = ({ field }: { field: any }) => {
    return <Heading level={6}>{String(field.label ?? "")}</Heading>;
};

const WebhookFormViewInner = observer(function WebhookFormViewInner() {
    const { presenter } = useFeature(WebhookFormPresenterFeature);
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.Form);
    const id = route.params.id;
    const defaultRenderers = useFieldRenderers();

    const renderers = useMemo(() => {
        return {
            ...defaultRenderers,
            "element:sectionHeading": SectionHeading
        };
    }, [defaultRenderers]);

    useEffect(() => {
        void presenter.init(id);
    }, [presenter, id]);

    const { vm, actions } = presenter;

    if (vm.loading) {
        return <OverlayLoader />;
    }

    return (
        <>
            <div className="flex flex-col h-main-content">
                <div className="flex items-center justify-between py-sm px-md">
                    <Heading level={5}>
                        {vm.isNew ? "Create Webhook" : (vm.webhook?.name ?? "Edit Webhook")}
                    </Heading>
                    <div className="flex gap-sm">
                        {!vm.isNew && (
                            <Button variant="secondary" onClick={() => actions.openDeliveries()}>
                                Deliveries
                            </Button>
                        )}
                        <Button variant="secondary" onClick={() => goToRoute(Routes.List)}>
                            Cancel
                        </Button>
                        {vm.permissions.canEdit && (
                            <Button
                                variant="primary"
                                onClick={() => void actions.save()}
                                disabled={vm.saving}
                            >
                                {vm.saving ? "Saving..." : "Save"}
                            </Button>
                        )}
                    </div>
                </div>
                <Separator />

                <div className="p-lg">
                    <>
                        <FormErrors form={vm.form} />
                        <FormView name="Webhook" form={vm.form} renderers={renderers} />
                        {!vm.isNew && vm.webhook?.signingSecret && (
                            <SigningSecret secret={vm.webhook.signingSecret} />
                        )}
                    </>
                </div>
            </div>
            {vm.showDeliveries && vm.webhook && (
                <WebhookDeliveriesDrawer
                    webhookId={vm.webhook.id}
                    open={vm.showDeliveries}
                    onClose={() => actions.closeDeliveries()}
                />
            )}
        </>
    );
});

export const WebhookFormView = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        GetWebhookFeature.register(child);
        CreateWebhookFeature.register(child);
        UpdateWebhookFeature.register(child);
        DeleteWebhookFeature.register(child);
        ListAvailableEventsFeature.register(child);
        WebhookPermissionsFeature.register(child);
        WebhookFormPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <WebhookFormViewInner />
        </DiContainerProvider>
    );
};
