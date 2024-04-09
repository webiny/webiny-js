import * as React from "react";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
// Components
import EditorBar from "./Bar";
import EditorContent from "./EditorContent";
import DragPreview from "./DragPreview";
import { useFormEditor } from "./Context";

const FormEditor = () => {
    const {
        getForm,
        state: { data, id }
    } = useFormEditor();

    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();

    React.useEffect((): void => {
        getForm(id).catch(() => {
            history.push(`/form-builder/forms`);
            showSnackbar("Could not load form with given ID.");
        });
    }, [id]);

    if (!data) {
        return null;
    }

    return (
        <div className={"form-editor"}>
            <EditorBar />
            <EditorContent />
            <DragPreview />
        </div>
    );
};

export default FormEditor;
