import React, { useCallback, useEffect, useMemo } from "react";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import {
    createReactiveComponent,
    FormView,
    FormErrors,
    useFieldRenderers,
    useRouter,
    useOpenDialog
} from "@webiny/app-admin";
import { useDialog } from "@webiny/app-admin/hooks/index.js";
import { Dialog, Text } from "@webiny/admin-ui";
import { useToast } from "@webiny/admin-ui";
import { useWebsockets } from "@webiny/app-websockets";
import { ReactComponent as AutoAwesomeIcon } from "@webiny/icons/auto_awesome.svg";
import { CreateComponentFeature } from "../feature.js";
import { RemoteComponentGatewayFeature } from "~/admin/features/shared/feature.js";
import { Routes } from "~/admin/routes.js";

export const CREATE_COMPONENT_DIALOG = "create-component";

const WS_ACTION_CONTENT = "remoteComponents.generateComponent.content";
const WS_ACTION_ERROR = "remoteComponents.generateComponent.error";

const CreateComponentDialogInner = createReactiveComponent(function CreateComponentDialogInner() {
    const { presenter } = useFeature(CreateComponentFeature);
    const { closeDialog } = useDialog();
    const { goToRoute } = useRouter();
    const toast = useToast();
    const renderers = useFieldRenderers();
    const websockets = useWebsockets();

    const { vm } = presenter;

    useEffect(() => {
        const contentSub = websockets.onMessage(WS_ACTION_CONTENT, async (message: any) => {
            presenter.processAiResponse(message.data);
            toast.showSuccessToast({ title: "Component generated successfully." });
            closeDialog();
            goToRoute(Routes.Editor, { id: message.data.id });
        });

        const errorSub = websockets.onMessage(WS_ACTION_ERROR, async (message: any) => {
            toast.showWarningToast({
                title: "AI generation failed",
                description: message.data.message
            });
            presenter.cancelGeneration();
        });

        return () => {
            contentSub.off();
            errorSub.off();
        };
    }, []);

    const handleGenerate = useCallback(async () => {
        await presenter.generate();
    }, [presenter]);

    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open) {
                    closeDialog();
                }
            }}
            size="lg"
            title="New component"
            description="Describe what you want and Webiny generates the first version. You can edit everything afterwards."
            info={
                <Text size="sm" className="text-neutral-strong">
                    Takes about 30 seconds. We&apos;ll open it in the editor when it&apos;s ready.
                </Text>
            }
            loading={vm.generating ? { text: "Generating component..." } : false}
            actions={
                <>
                    <Dialog.CancelAction text="Cancel" />
                    <Dialog.ConfirmAction
                        text="Generate component"
                        icon={<AutoAwesomeIcon />}
                        onClick={handleGenerate}
                        disabled={vm.generating}
                    />
                </>
            }
        >
            <FormErrors form={vm.form} className="mb-sm" />
            <FormView name="CreateComponent" form={vm.form} renderers={renderers} />
        </Dialog>
    );
});

export const CreateComponentDialogContent = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        RemoteComponentGatewayFeature.register(child);
        CreateComponentFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <CreateComponentDialogInner />
        </DiContainerProvider>
    );
};

export function useCreateComponentDialog() {
    const { openDialog } = useOpenDialog();

    return {
        openDialog: useCallback(() => {
            openDialog(CREATE_COMPONENT_DIALOG, {});
        }, [openDialog])
    };
}
