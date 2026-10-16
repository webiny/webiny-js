import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { useDocumentEditor } from "@webiny/app-website-builder/DocumentEditor/index.js";
import { WbPageReviewFeature } from "~/features/editorReview/feature.js";

/*
 * The one place that decides whether the canvas is read-only: the editor's own options (a page
 * that is not a draft) or a review state that does not allow editing, including an unknown one.
 */
export const PageReadOnlySync = createReactiveComponent(() => {
    const { session } = useFeature(WbPageReviewFeature);
    const editor = useDocumentEditor();
    const allowsEditing = session.presenter.vm.allowsEditing;

    useEffect(() => {
        const options = editor.getEditorOptions();
        editor.updateEditor(state => {
            state.isReadOnly = options.isReadOnly === true || !allowsEditing;
        });
    }, [editor, allowsEditing]);

    return null;
});
