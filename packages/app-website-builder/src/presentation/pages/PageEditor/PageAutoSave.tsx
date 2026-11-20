import React, { useEffect } from "react";
import debounce from "lodash/debounce.js";
import { useFeature } from "@webiny/app";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { useUpdatePage } from "~/features/pages/index.js";
import { isGlobalOnlyChange } from "~/presentation/globals/overrides/isGlobalOnlyChange.js";
import { PageGlobalComponentsFeature } from "./GlobalComponents/feature.js";

const PageAutoSaveAction = () => {
    const editor = useDocumentEditor();

    const { updatePage } = useUpdatePage();
    const { presenter: globalComponents } = useFeature(PageGlobalComponentsFeature);

    // The page as stored: without global instances, with its overrides of globals and layout elements.
    const savePage = debounce(page => {
        return updatePage(globalComponents.toStoredDocument(page));
    }, 500);

    useEffect(() => {
        // A global's changes saved for this page only are page data: save the page.
        const offOverrides = globalComponents.onOverridesChange(() => {
            if (!editor.getEditorState().read().isReadOnly) {
                void savePage(editor.getDocumentState().toJson());
            }
        });

        const offChanges = editor.onDocumentStateChange(async event => {
            const isReadOnly = editor.getEditorState().read().isReadOnly;
            if (isReadOnly) {
                return;
            }

            const { state } = event;
            if (isGlobalOnlyChange(event.diff, state.elements)) {
                return;
            }

            editor.updateEditor(state => {
                state.autoSaving = true;
            });

            await savePage(state);

            setTimeout(() => {
                editor.updateEditor(state => {
                    state.autoSaving = false;
                });
            }, 500);
        });

        return () => {
            offOverrides();
            offChanges();
        };
    }, []);

    return null;
};

export const PageAutoSave = () => {
    return <PageAutoSaveAction />;
};
