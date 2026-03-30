import React, { useEffect, useState } from "react";
import {
    $selectElement,
    useDocumentEditor,
    useElementComponentManifest
} from "webiny/admin/website-builder/page/editor";
import { OpenSettingsDialog } from "@/extensions/funnelBuilder/pageEditor/components/commands/OpenSettingsDialog.js";
import { FieldSettingsDialog } from "../components/FieldSettingsDialog";

export function FieldElementSettings() {
    const [dialogElement, setDialogElement] = useState<string | null>(null);
    const canShowDialog = useCanShowSettingsDialog(dialogElement);

    const editor = useDocumentEditor();

    useEffect(() => {
        // Listen for OpenSettingsDialog command
        return editor.registerCommandHandler(OpenSettingsDialog, ({ elementId }) => {
            // Set element as "active"
            $selectElement(editor, elementId);
            // Set elementId for the dialog content
            setDialogElement(elementId);
        });
    }, []);

    const hideFieldSettingsDialog = () => {
        setDialogElement(null);
    };

    return (
        <FieldSettingsDialog
            open={canShowDialog}
            elementId={dialogElement}
            onClose={hideFieldSettingsDialog}
        />
    );
}

const useCanShowSettingsDialog = (elementId: string | null) => {
    const component = useElementComponentManifest(elementId ?? "");
    if (!component) {
        return false;
    }
    return component.name.startsWith("Fub/Field/");
};
