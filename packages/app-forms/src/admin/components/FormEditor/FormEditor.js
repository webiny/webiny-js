// @flow
import * as React from "react";
import HTML5Backend from "react-dnd-html5-backend";
import { DragDropContext } from "react-dnd";
// Components
import EditorBar from "./Bar";
import EditorContent from "./EditorContent";
import DragPreview from "./DragPreview";
import useReactRouter from "use-react-router";
import { useSnackbar } from "@webiny/app-admin/components";
import { useFormEditor } from "./Context";

const FormEditor = () => {
    const {
        getForm,
        state: { data, id }
    } = useFormEditor();

    const { history } = useReactRouter();
    const { showSnackbar } = useSnackbar();


    React.useEffect(() => {
        getForm(id).catch(() => {
            history.push(`/forms`);
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

export default DragDropContext(HTML5Backend)(FormEditor);
