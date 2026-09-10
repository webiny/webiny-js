import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, ScrollArea, Separator, Text } from "@webiny/admin-ui";
import { useDocumentEditor } from "@webiny/app-website-builder/DocumentEditor/index.js";
import { ElementInputs } from "@webiny/app-website-builder/BaseEditor/defaultConfig/Sidebar/ElementSettings/ElementInputs.js";
import { useSelectFromEditor } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromEditor.js";
import { ReactComponent as SaveIcon } from "@webiny/icons/save.svg";
import type { EditorState } from "@webiny/app-website-builder/editorSdk/Editor.js";
import { SANDBOX_ELEMENT_ID } from "./SandboxEditor.js";

interface SandboxInputPanelProps {
    componentName: string;
    onSetDefaults: () => void;
    onReset: () => void;
}

export const SandboxInputPanel = createReactiveComponent(function SandboxInputPanel({
    componentName,
    onSetDefaults,
    onReset
}: SandboxInputPanelProps) {
    const editor = useDocumentEditor();
    const document = editor.getDocumentState().read();
    const element = document.elements[SANDBOX_ELEMENT_ID];

    const manifest = useSelectFromEditor(
        (state: EditorState) => state.components?.[componentName],
        [componentName]
    );

    if (!element || !manifest) {
        return (
            <div className="p-md">
                <Text size="sm" className="text-neutral-strong">
                    Loading component inputs...
                </Text>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1 min-h-0">
                <ElementInputs key={JSON.stringify(manifest.inputs)} element={element} />
            </ScrollArea>
            <Separator />
            <div className="flex-shrink-0 flex items-center gap-sm px-md py-sm">
                <Button
                    variant="secondary"
                    size="md"
                    icon={<SaveIcon />}
                    text="Set as defaults"
                    onClick={onSetDefaults}
                    className="flex-1"
                />
                <Button variant="ghost" size="md" text="Reset" onClick={onReset} />
            </div>
        </div>
    );
});
