import React, { useEffect, useMemo } from "react";
import debounce from "lodash/debounce.js";
import type { EditorPage } from "@webiny/website-builder-sdk";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { useExperiments } from "./useExperiments.js";
import { useExperimentsEditor } from "./ExperimentsEditorContext.js";
import { editorDocumentToVariantUpdate } from "./variantDocument.js";

const VariantAutoSaveAction = ({ variantRevisionId }: { variantRevisionId: string }) => {
    const editor = useDocumentEditor<EditorPage>();
    const { gateway } = useExperiments();

    const saveVariant = useMemo(
        () =>
            debounce((document: EditorPage) => {
                return gateway.updateVariant(
                    variantRevisionId,
                    editorDocumentToVariantUpdate(document)
                );
            }, 500),
        [gateway, variantRevisionId]
    );

    useEffect(() => {
        return editor.onDocumentStateChange(async event => {
            if (editor.getEditorState().read().isReadOnly) {
                return;
            }
            editor.updateEditor(state => {
                state.autoSaving = true;
            });
            await saveVariant(event.state);
            setTimeout(() => {
                editor.updateEditor(state => {
                    state.autoSaving = false;
                });
            }, 500);
        });
    }, [saveVariant]);

    return null;
};

/** Autosaves the edited document back to the selected variant (mirrors PageAutoSave for variants). */
export const VariantAutoSave = () => {
    const { selectedVariant } = useExperimentsEditor();
    if (!selectedVariant) {
        return null;
    }
    return <VariantAutoSaveAction variantRevisionId={selectedVariant.id} />;
};
