// @flow
import * as React from "react";
import HTML5Backend from "react-dnd-html5-backend";
import { DragDropContext } from "react-dnd";
import { useFormEditor } from "./Context";
import { compose } from "recompose";
// Components
import EditorBar from "./Bar";
import EditorContent from "./EditorContent";
import DragPreview from "./DragPreview";
import { withRouter } from "react-router-dom";
import { withSnackbar } from "webiny-app-admin/components";

const FormEditor = ({ history, showSnackbar }) => {
    const {
        getForm,
        state: { data, id }
    } = useFormEditor();

    React.useEffect(() => {
        getForm(id).catch(() => {
            history.push(`/forms`);
            showSnackbar("Could not load form with given ID.");
        });
    }, []);

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

export default compose(
    withRouter,
    withSnackbar(),
    DragDropContext(HTML5Backend)
)(FormEditor);
