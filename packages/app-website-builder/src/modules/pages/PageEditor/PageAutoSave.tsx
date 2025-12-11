import React, { useEffect } from "react";
import debounce from "lodash/debounce.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { useUpdatePage } from "~/features/pages/index.js";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";

const PageAutoSaveAction = () => {
    const editor = useDocumentEditor();
    const { updatePage } = useUpdatePage();

    const savePage = debounce(page => {
        return updatePage(page);
    }, 500);

    useEffect(() => {
        return editor.onDocumentStateChange(async event => {
            editor.updateEditor(state => {
                state.autoSaving = true;
            });
            const { state } = event;

            await savePage(state);

            setTimeout(() => {
                editor.updateEditor(state => {
                    state.autoSaving = false;
                });
            }, 500);
        });
    }, []);

    return null;
};

export const PageAutoSave = () => {
    const isSaving = useSelectFromEditor(state => state.autoSaving ?? false);

    return (
        <>
            <PageAutoSaveAction />
            {isSaving ? (
                <div className="text-neutral-muted animate-pulse">Autosaving...</div>
            ) : null}
        </>
    );
};
