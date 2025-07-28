import React, { useEffect } from "react";
import debounce from "lodash/debounce";
import { useDocumentEditor } from "~/DocumentEditor";
import { useUpdatePage } from "~/features/pages";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor";

export const PageAutoSave = () => {
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

export const AutoSaveIndicator = () => {
    const isSaving = useSelectFromEditor(state => state.autoSaving ?? false);

    return isSaving ? (
        <div className="wby-text-neutral-muted wby-animate-pulse">Autosaving...</div>
    ) : null;
};
