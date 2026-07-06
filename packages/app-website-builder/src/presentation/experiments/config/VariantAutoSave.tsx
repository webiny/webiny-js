import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import debounce from "lodash/debounce.js";
import { useFeature } from "@webiny/app";
import type { EditorPage } from "@webiny/website-builder-sdk";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { ExperimentsEditorPresenterFeature } from "../ExperimentsEditor/index.js";
import { editorDocumentToVariantUpdate } from "../shared/variantDocument.js";

const VariantAutoSaveAction = ({ variantRevisionId }: { variantRevisionId: string }) => {
    const editor = useDocumentEditor<EditorPage>();
    const { presenter } = useFeature(ExperimentsEditorPresenterFeature);

    const saveVariant = useMemo(
        () =>
            debounce((document: EditorPage) => {
                return presenter.saveVariant(
                    variantRevisionId,
                    editorDocumentToVariantUpdate(document)
                );
            }, 500),
        [presenter, variantRevisionId]
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
export const VariantAutoSave = observer(function VariantAutoSave() {
    const { presenter } = useFeature(ExperimentsEditorPresenterFeature);
    const { selectedVariant } = presenter.vm;
    if (!selectedVariant) {
        return null;
    }
    return <VariantAutoSaveAction variantRevisionId={selectedVariant.id} />;
});
