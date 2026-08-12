import React, { useCallback, useEffect, useMemo } from "react";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { createReactiveComponent, useRouter, useOpenDialog } from "@webiny/app-admin";
import { useDialog } from "@webiny/app-admin/hooks/index.js";
import { Dialog, Input, Select, useToast } from "@webiny/admin-ui";
import { CreateJobFeature } from "../feature.js";
import { ComponentExtractionGatewayFeature } from "~/features/gateway/feature.js";
import { Routes } from "~/routes.js";

export const CREATE_JOB_DIALOG = "component-extraction-create-job";

const CreateJobDialogInner = createReactiveComponent(function CreateJobDialogInner() {
    const { presenter } = useFeature(CreateJobFeature);
    const { closeDialog } = useDialog();
    const { goToRoute } = useRouter();
    const toast = useToast();

    const { vm } = presenter;

    useEffect(() => {
        presenter.init();
        return () => presenter.reset();
    }, [presenter]);

    const handleCreate = useCallback(async () => {
        try {
            const runId = await presenter.create();
            toast.showSuccessToast({ title: "Extraction created." });
            closeDialog();
            goToRoute(Routes.Run, { runId });
        } catch (error) {
            toast.showWarningToast({
                title: "Could not create extraction",
                description: (error as Error).message
            });
        }
    }, [presenter, closeDialog, goToRoute, toast]);

    const themeOptions = useMemo(
        () =>
            vm.themes.map(theme => ({
                label: `${theme.name} (v${theme.version})`,
                value: theme.id
            })),
        [vm.themes]
    );

    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open) {
                    closeDialog();
                }
            }}
            size="md"
            title="New extraction"
            description="Point Webiny at a site; it crawls the pages and generates components you review one stage at a time."
            loading={vm.creating ? { text: "Creating extraction..." } : false}
            actions={
                <>
                    <Dialog.CancelAction text="Cancel" />
                    <Dialog.ConfirmAction
                        text="Create"
                        onClick={handleCreate}
                        disabled={vm.creating}
                    />
                </>
            }
        >
            <div className="flex flex-col gap-md">
                <Input
                    label="Name"
                    value={vm.name}
                    onChange={(value: string) => presenter.setName(value)}
                    placeholder="Acme marketing site"
                    required
                />
                <Input
                    label="Site URL"
                    value={vm.siteUrl}
                    onChange={(value: string) => presenter.setSiteUrl(value)}
                    placeholder="https://www.example.com"
                    required
                />
                <Select
                    label="Theme"
                    value={vm.themeId}
                    onChange={(value: string) => presenter.setTheme(value)}
                    placeholder={vm.loadingThemes ? "Loading themes..." : "Select a theme"}
                    options={themeOptions}
                    required
                />
                <Input
                    label="Page cap"
                    type="number"
                    value={vm.pageCap}
                    onChange={(value: string) => presenter.setPageCap(value)}
                    note="How many pages to crawl at most. Capped at 150."
                />
            </div>
        </Dialog>
    );
});

export const CreateJobDialogContent = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ComponentExtractionGatewayFeature.register(child);
        CreateJobFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <CreateJobDialogInner />
        </DiContainerProvider>
    );
};

export function useCreateJobDialog() {
    const { openDialog } = useOpenDialog();

    return {
        openDialog: useCallback(() => {
            openDialog(CREATE_JOB_DIALOG, {});
        }, [openDialog])
    };
}
