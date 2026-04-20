import React, { useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useDialog } from "@webiny/app-admin";
import { Dialog, Textarea } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { useSelectFromEditor } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromEditor.js";
import { useCreateElement } from "@webiny/app-website-builder/BaseEditor/hooks/useCreateElement.js";
import { GenerateContentFeature } from "./feature.js";
import type { CreateElementParams } from "./abstractions.js";

export const GENERATE_CONTENT_DIALOG = "generate-content";

export const GenerateContentDialog = observer(() => {
    const { closeDialog } = useDialog();
    const { presenter } = useFeature(GenerateContentFeature);
    const vm = presenter.vm;

    const components = useSelectFromEditor(state => state.components);
    const { createElement } = useCreateElement();

    const createElements = useCallback(
        (elements: CreateElementParams[]) => {
            elements.forEach(el => createElement(el));
        },
        [createElement]
    );

    useEffect(() => {
        presenter.init(components, createElements);
    }, [components, createElements]);

    const handleSubmit = async () => {
        await presenter.submit();
        closeDialog();
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
                    {/*<Dialog.ConfirmAction
                        onClick={() => presenter.processAiResponse()}
                        text="Process AI Response"
                    />*/}
                    <Dialog.ConfirmAction
                        onClick={handleSubmit}
                        text="Generate"
                        disabled={!vm.prompt.trim() || vm.submitting}
                    />
                </>
            }
        >
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
