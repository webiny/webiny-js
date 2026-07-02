import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { FormView } from "@webiny/app-admin";
import { Button, OverlayLoader, useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import type { IncomingGenericData } from "@webiny/app-websockets";
import { useWebsockets } from "@webiny/app-websockets";
import { useModel } from "@webiny/app-headless-cms/admin/components/ModelProvider/useModel.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import { CmsGenerateContentFeature } from "~/admin/presentation/CmsContentGeneration/feature.js";
import { decompressGzipBase64 } from "~/admin/presentation/WbContentGeneration/decompressGzipBase64.js";

function formatElapsed(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

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

export const CmsEntryWizard = observer(() => {
    const { presenter } = useFeature(CmsGenerateContentFeature);
    const formPresenter = useContentEntryFormPresenter();
    const { model } = useModel();
    const vm = presenter.vm;
    const wasSubmitting = useRef(false);
    const websockets = useWebsockets();
    const toast = useToast();

    useEffect(() => {
        presenter.init().catch(err => {
            console.error("Failed to initialize AI entry wizard", err);
        });
    }, []);

    useEffect(() => {
        const contentSubscription = websockets.onMessage<GenerateEntryContentMessage>(
            WS_ACTION_CONTENT,
            async message => {
                const responseText = await decompressGzipBase64(message.data.value);
                try {
                    const entryValues = await presenter.processAiResponse(responseText);
                    formPresenter.newEntry(entryValues);
                } catch (e) {
                    console.error("Failed to process AI response", e);
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
            // Generation completed successfully — form was created via newEntry()
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
        await presenter.submit(model.modelId);
    };

    const handleSkip = () => {
        formPresenter.newEntry();
    };

    return (
        <div className="flex justify-center pt-xl">
            <div
                className="bg-neutral-base rounded-lg p-lg flex flex-col gap-md"
                style={{ width: 600 }}
            >
                <h3 className="text-lg font-semibold">Generate Entry Content</h3>
                <p className="text-neutral-muted">
                    Use AI to generate content for this entry. Configure the prompt and click
                    Generate, or skip to create an empty entry.
                </p>
                {vm.loading ? <OverlayLoader text={"Loading..."} /> : null}
                {vm.submitting ? (
                    <OverlayLoader
                        className={"bg-neutral-base/90"}
                        text={
                            <>
                                <div>Generating content... {formatElapsed(vm.elapsedSeconds)}</div>
                                <div className="text-sm text-neutral-muted pt-xs">
                                    Content generation can take a few minutes, depending on the
                                    model you&apos;re using.
                                </div>
                            </>
                        }
                    />
                ) : null}
                {vm.form ? <FormView name="CmsEntryWizard" form={vm.form} /> : null}
                <div className="flex justify-end gap-sm">
                    <Button variant="secondary" onClick={handleSkip}>
                        Skip
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={vm.loading || vm.submitting}
                    >
                        Generate
                    </Button>
                </div>
            </div>
        </div>
    );
});
