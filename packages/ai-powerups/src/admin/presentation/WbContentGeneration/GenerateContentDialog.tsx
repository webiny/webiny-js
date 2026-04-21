import React, { useCallback, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useDialog } from "@webiny/app-admin";
import { Dialog, OverlayLoader, Textarea } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import type { IncomingGenericData } from "@webiny/app-websockets";
import { useWebsockets } from "@webiny/app-websockets";
import { useSelectFromEditor } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromEditor.js";
import { useCreateElement } from "@webiny/app-website-builder/BaseEditor/hooks/useCreateElement.js";
import { GenerateContentFeature } from "./feature.js";
import { decompressGzipBase64 } from "./decompressGzipBase64.js";
import type { CreateElementParams } from "./abstractions.js";

export const GENERATE_CONTENT_DIALOG = "generate-content";

export const WS_ACTION = "aiPowerUps.generatePageContent";

export interface GeneratePageContentMessage extends IncomingGenericData {
    action: typeof WS_ACTION;
    data: {
        compression: "gzip";
        value: string;
    };
}

export const GenerateContentDialog = observer(() => {
    const { closeDialog } = useDialog();
    const { presenter } = useFeature(GenerateContentFeature);
    const vm = presenter.vm;
    const wasSubmitting = useRef(false);
    const websockets = useWebsockets();

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
        const subscription = websockets.onMessage<GeneratePageContentMessage>(
            WS_ACTION,
            async message => {
                const responseText = await decompressGzipBase64(message.data.value);
                console.log("responseText", responseText);
                await presenter.processAiResponse(responseText);
            }
        );

        return () => {
            subscription.off();
        };
    }, []);

    useEffect(() => {
        if (wasSubmitting.current && !vm.submitting) {
            closeDialog();
        }
        wasSubmitting.current = vm.submitting;
    }, [vm.submitting]);

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
                        disabled={!vm.prompt.trim() || vm.submitting}
                    />
                </>
            }
        >
            {vm.submitting ? <OverlayLoader text={"Generating content..."} /> : null}
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
