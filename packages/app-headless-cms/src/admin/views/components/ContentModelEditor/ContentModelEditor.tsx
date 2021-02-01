import * as React from "react";
import { useRouter, Prompt } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
// Components
import EditorBar from "./Bar";
import EditorContent from "./EditorContent";
import DragPreview from "./DragPreview";
import { useContentModelEditor } from "./Context";

import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/editor");

const prompt = t`There are some unsaved changes! Are you sure you want to navigate away and discard all changes?`;

const ContentModelEditor = () => {
    const {
        getContentModel,
        state: { data, modelId, isPristine }
    } = useContentModelEditor();

    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();

    React.useEffect(() => {
        getContentModel(modelId).catch(() => {
            history.push(`/cms/content-models`);
            showSnackbar(t`Could not load content model with given ID.`);
        });
    }, [modelId]);

    if (!data) {
        return null;
    }

    return (
        <div className={"content-model-editor"}>
            <Prompt when={!isPristine} message={prompt} />
            <EditorBar />
            <EditorContent />
            <DragPreview />
        </div>
    );
};

export default ContentModelEditor;
