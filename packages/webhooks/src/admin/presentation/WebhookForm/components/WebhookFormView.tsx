import React, { useEffect, useMemo, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature, useRoute } from "@webiny/app";
import {
    FormErrors,
    useRouter,
    useFieldRenderers,
    SimpleForm,
    SimpleFormHeader,
    SimpleFormContent,
    SimpleFormFooter,
    FormView
} from "@webiny/app-admin";
import { Button, OverlayLoader } from "@webiny/admin-ui";
import { useToast } from "@webiny/admin-ui";
import { WebhookFormPresenterFeature } from "../feature.js";
import { GetWebhookFeature } from "~/admin/features/getWebhook/feature.js";
import { CreateWebhookFeature } from "~/admin/features/createWebhook/feature.js";
import { UpdateWebhookFeature } from "~/admin/features/updateWebhook/feature.js";
import { DeleteWebhookFeature } from "~/admin/features/deleteWebhook/feature.js";
import { ListAvailableEventsFeature } from "~/admin/features/listAvailableEvents/feature.js";
import { WebhookPermissionsFeature } from "~/admin/features/permissions/feature.js";
import { Routes } from "~/admin/routes.js";
import { SigningSecret } from "./SigningSecret.js";
import { HasPermission } from "~/admin/presentation/security/HasPermission.js";

const SectionHeading = ({ field }: { field: any }) => {
    return <span className="text-md font-semibold">{String(field.label ?? "")}</span>;
};

const WebhookFormViewInner = observer(function WebhookFormViewInner() {
    const { presenter } = useFeature(WebhookFormPresenterFeature);
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.Form);
    const toast = useToast();
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

    const saveForm = useCallback(async () => {
        const res = await presenter.save();
        if (res) {
            toast.showSuccessToast({ title: "Webhook saved successfully!" });
        }
    }, [presenter]);

    const { vm } = presenter;

    return (
        <SimpleForm>
            {vm.loading ? <OverlayLoader text={"Loading..."} /> : null}
            {vm.saving ? <OverlayLoader text={"Saving..."} /> : null}
            {vm.form.errors.length > 0 ? (
                <div className={"mb-lg"}>
                    <FormErrors form={vm.form} />
                </div>
            ) : null}
            <SimpleFormHeader
                title={vm.isNew ? "Create Webhook" : (vm.webhook?.name ?? "Edit Webhook")}
            />
            <SimpleFormContent>
                <FormView name="Webhook" form={vm.form} renderers={renderers} />
                <SigningSecret presenter={presenter} />
            </SimpleFormContent>
            <SimpleFormFooter className={"border-t-sm border-t-neutral-dimmed pt-lg"}>
                <Button variant="secondary" onClick={() => goToRoute(Routes.List)}>
                    Cancel
                </Button>
                <HasPermission entity="webhook" action="edit">
                    <Button variant="primary" onClick={saveForm} disabled={vm.saving}>
                        {vm.saving ? "Saving..." : "Save"}
                    </Button>
                </HasPermission>
            </SimpleFormFooter>
        </SimpleForm>
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
