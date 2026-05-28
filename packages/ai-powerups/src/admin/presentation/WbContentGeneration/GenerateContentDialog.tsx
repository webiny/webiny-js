import React, { useCallback, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useDialog, FormView } from "@webiny/app-admin";
import { Dialog, OverlayLoader, useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import type { IncomingGenericData } from "@webiny/app-websockets";
import { useWebsockets } from "@webiny/app-websockets";
import { useSelectFromEditor } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromEditor.js";
import { useCreateElement } from "@webiny/app-website-builder/BaseEditor/hooks/useCreateElement.js";
import { GenerateContentFeature } from "./feature.js";
import { decompressGzipBase64 } from "./decompressGzipBase64.js";
import type { CreateElementParams } from "./abstractions.js";

function formatElapsed(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export const GENERATE_CONTENT_DIALOG = "generate-content";

export const WS_ACTION_CONTENT = "aiPowerUps.generatePageContent.content";
export const WS_ACTION_ERROR = "aiPowerUps.generatePageContent.error";

export interface GeneratePageContentMessage extends IncomingGenericData {
    action: typeof WS_ACTION_CONTENT;
    data: {
        compression: "gzip";
        value: string;
    };
}

export interface GeneratePageContentErrorMessage extends IncomingGenericData {
    action: typeof WS_ACTION_ERROR;
    data: {
        message: string;
    };
}

export const GenerateContentDialog = observer(() => {
    const { closeDialog } = useDialog();
    const { presenter } = useFeature(GenerateContentFeature);
    const vm = presenter.vm;
    const wasSubmitting = useRef(false);
    const websockets = useWebsockets();
    const toast = useToast();

    const components = useSelectFromEditor(state => state.components);
    const { createElement } = useCreateElement();

    const createElements = useCallback(
        async (elements: CreateElementParams[]) => {
            for (const el of elements) {
                await createElement(el);
            }
        },
        [createElement]
    );

    useEffect(() => {
        const aiComponents = Object.values(components)
            .filter(c => c.useInAiContentGeneration !== false)
            .map(c => {
                return {
                    name: c.name,
                    label: c.label,
                    aiContext: c.aiContext,
                    inputs: c.inputs.map(input => ({
                        type: input.type,
                        name: input.name,
                        label: input.label,
                        description: input.description
                    }))
                };
            });
        presenter.init(aiComponents, createElements);
    }, [components, createElements]);

    useEffect(() => {
        const contentSubscription = websockets.onMessage<GeneratePageContentMessage>(
            WS_ACTION_CONTENT,
            async message => {
                const responseText = await decompressGzipBase64(message.data.value);
                try {
                    await presenter.processAiResponse(responseText);
                } catch (e) {
                    console.error("Failed to process AI response", { responseText });
                    console.error(e);
                    toast.showWarningToast({
                        title: "Failed to process AI response",
                        description: "Open the console for more details."
                    });
                    presenter.cancelPrompt();
                }
            }
        );

        const errorSubscription = websockets.onMessage<GeneratePageContentErrorMessage>(
            WS_ACTION_ERROR,
            async message => {
                toast.showWarningToast({
                    title: "Failed to generate content",
                    description: message.data.message
                });
                presenter.cancelPrompt();
            }
        );

        return () => {
            contentSubscription.off();
            errorSubscription.off();
        };
    }, []);

    useEffect(() => {
        if (wasSubmitting.current && !vm.submitting && !vm.timedOut) {
            closeDialog();
        }
        wasSubmitting.current = vm.submitting;
    }, [vm.submitting]);

    useEffect(() => {
        if (vm.timedOut) {
            toast.showWarningToast({
                title: "Request timed out",
                description: "The AI generation took too long. Please try again."
            });
        }
    }, [vm.timedOut]);

    const handleSubmit = async () => {
        await presenter.submit();
    };

    return (
        <Dialog
            open={true}
            onClose={closeDialog}
            title="Generate Content"
            size={"lg"}
            actions={
                <>
                    <Dialog.CancelAction onClick={closeDialog} text="Cancel" />
                    <Dialog.ConfirmAction
                        onClick={handleSubmit}
                        text="Generate"
                        disabled={vm.loading || vm.submitting}
                    />
                </>
            }
        >
            {vm.loading ? <OverlayLoader text={"Loading..."} /> : null}
            {vm.submitting ? (
                <OverlayLoader
                    className={"bg-neutral-base/90"}
                    text={
                        <>
                            <div>Generating content... {formatElapsed(vm.elapsedSeconds)}</div>
                            <div className="text-sm text-neutral-muted pt-xs">
                                Content generation can take a few minutes, depending on the model
                                you&apos;re using.
                            </div>
                        </>
                    }
                />
            ) : null}
            {vm.processing ? <OverlayLoader text={"Processing content..."} /> : null}
            {vm.form ? <FormView name="GenerateContent" form={vm.form} /> : null}
        </Dialog>
    );
});
