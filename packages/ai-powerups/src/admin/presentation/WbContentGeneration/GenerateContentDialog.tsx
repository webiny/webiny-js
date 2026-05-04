import React, { useCallback, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useDialog } from "@webiny/app-admin";
import { Dialog, OverlayLoader, Textarea, useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import type { IncomingGenericData } from "@webiny/app-websockets";
import { useWebsockets } from "@webiny/app-websockets";
import { useSelectFromEditor } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromEditor.js";
import { useCreateElement } from "@webiny/app-website-builder/BaseEditor/hooks/useCreateElement.js";
import { GenerateContentFeature } from "./feature.js";
import { decompressGzipBase64 } from "./decompressGzipBase64.js";
import type { CreateElementParams } from "./abstractions.js";

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
        (elements: CreateElementParams[]) => {
            elements.forEach(el => createElement(el));
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
                await presenter.processAiResponse(responseText);
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

    const submitHtml = () => {
        presenter.processAiResponse(
            JSON.stringify([
                {
                    component: "Webiny/Lexical",
                    inputs: {
                        content: {
                            tool: "textToLexical",
                            params: {
                                text: "<h1>Song of the Living Earth</h1><p>The morning opens gently, and the world begins to sing. From forest shadows to rolling tides, nature carries a melody that feels both timeless and new. This song celebrates the quiet power of the wild, where every breeze, birdcall, and wave becomes part of a larger harmony.</p><h2>Verse One: Dawn in the Forest</h2><p>The sun wakes softly through the pine,</p><p>And gold spills down the cedar line.</p><p>The brook hums low beneath the trees,</p><p>A silver thread in morning breeze.</p>"
                            }
                        }
                    }
                },
                {
                    component: "Webiny/Lexical",
                    inputs: {
                        content: {
                            tool: "textToLexical",
                            params: {
                                text: "<h2>Verse Two: The River’s Journey</h2><p>The river travels, clear and bold,</p><p>Through stone and root and fields of gold.</p><p>It teaches hearts to move, to flow,</p><p>To leave the banks and still grow whole.</p><h3>Chorus</h3><p>Oh, nature sings in every leaf,</p><p>In winds of joy and rains of grief.</p><p>We listen close, we learn, we stay,</p><p>And find our rhythm in its sway.</p><p>Like mountains holding up the sky,</p><p>And eagles carving paths to fly,</p><p>The earth reminds us, calm and free,</p><p>That life is meant for harmony.</p>"
                            }
                        }
                    }
                },
                {
                    component: "Webiny/Lexical",
                    inputs: {
                        content: {
                            tool: "textToLexical",
                            params: {
                                text: "<h2>Verse Three: Evening Wildflowers</h2><p>When daylight fades to amber sky,</p><p>The meadow blooms before goodbye.</p><p>The crickets tune the final part,</p><p>And dusk grows tender in the heart.</p><p>So let us walk with gentle feet,</p><p>And keep the wild, and keep it sweet.</p><p>For every branch, each shore, each stream,</p><p>Is nature’s voice inside the dream.</p><p><strong>Final refrain:</strong> Oh, nature sings in every leaf, in winds of joy and rains of grief. We listen close, we learn, we stay, and find our rhythm in its sway.</p><p><em>Let the earth be your song, and the song be your home.</em></p>"
                            }
                        }
                    }
                }
            ])
        );
    };

    useEffect(() => {
        if (wasSubmitting.current && !vm.submitting) {
            closeDialog();
        }
        wasSubmitting.current = vm.submitting;
    }, [vm.submitting]);

    const handleSubmit = async () => {
        await presenter.submit();
    };

    const isProcessing = vm.processing;
    const isSubmitting = vm.submitting;

    return (
        <Dialog
            open={true}
            onClose={closeDialog}
            title="Generate Content"
            size={"lg"}
            actions={
                <>
                    <Dialog.CancelAction onClick={closeDialog} text="Cancel" />
                    <Dialog.ConfirmAction onClick={submitHtml} text="Submit HTML" />
                    <Dialog.ConfirmAction
                        onClick={handleSubmit}
                        text="Generate"
                        disabled={!vm.prompt.trim() || vm.submitting}
                    />
                </>
            }
        >
            {isSubmitting ? <OverlayLoader text={"Generating content..."} /> : null}
            {isProcessing ? <OverlayLoader text={"Processing content..."} /> : null}
            <Textarea
                label="Prompt"
                description="Describe the page content you want to generate."
                value={vm.prompt}
                onChange={value => presenter.setPrompt(String(value ?? ""))}
                rows={6}
            />
        </Dialog>
    );
});
