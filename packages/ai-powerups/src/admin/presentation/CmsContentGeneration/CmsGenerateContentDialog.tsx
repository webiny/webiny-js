import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useDialog, FormView } from "@webiny/app-admin";
import { Dialog, OverlayLoader, useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import type { IncomingGenericData } from "@webiny/app-websockets";
import { useWebsockets } from "@webiny/app-websockets";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { CmsGenerateContentFeature } from "./feature.js";
import { decompressGzipBase64 } from "~/admin/presentation/WbContentGeneration/decompressGzipBase64.js";

function formatElapsed(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export const CMS_GENERATE_CONTENT_DIALOG = "cms-generate-content";

const WS_ACTION_CONTENT = "aiPowerUps.generateEntryContent.content";
const WS_ACTION_ERROR = "aiPowerUps.generateEntryContent.error";

interface GenerateEntryContentMessage extends IncomingGenericData {
    action: typeof WS_ACTION_CONTENT;
    data: {
        compression: "gzip";
        value: string;
    };
}

interface GenerateEntryContentErrorMessage extends IncomingGenericData {
    action: typeof WS_ACTION_ERROR;
    data: {
        message: string;
    };
}

export const CmsGenerateContentDialog = observer(() => {
    const { closeDialog, params } = useDialog();
    const { presenter } = useFeature(CmsGenerateContentFeature);
    const formPresenter = useContentEntryFormPresenter();
    const vm = presenter.vm;
    const wasSubmitting = useRef(false);
    const websockets = useWebsockets();
    const toast = useToast();
    const modelId = params.modelId as string;

    useEffect(() => {
        presenter.init();
    }, []);

    useEffect(() => {
        const contentSubscription = websockets.onMessage<GenerateEntryContentMessage>(
            WS_ACTION_CONTENT,
            async message => {
                const responseText = await decompressGzipBase64(message.data.value);
                try {
                    const entryValues = await presenter.processAiResponse(responseText);
                    const form = formPresenter.vm.form;
                    if (form) {
                        form.setData(entryValues);
                    }
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

        const errorSubscription = websockets.onMessage<GenerateEntryContentErrorMessage>(
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
        await presenter.submit(modelId);
    };

    return (
        <Dialog
            open={true}
            onClose={closeDialog}
            title="Generate Entry Content"
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
            {vm.form ? <FormView name="CmsGenerateContent" form={vm.form} /> : null}
        </Dialog>
    );
});
