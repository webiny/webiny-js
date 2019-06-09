// @flow
import * as React from "react";
import HTML5Backend from "react-dnd-html5-backend";
import { DragDropContext } from "react-dnd";
import { useFormEditor } from "./Context";

// Components
import EditorBar from "./Bar";
import EditorContent from "./Content";
import DragPreview from "./DragPreview";


const FormEditor = () => {
    const {
        getForm,
        state: { data, id }
    } = useFormEditor();

    React.useEffect(() => {
        getForm(id);
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

export default DragDropContext(HTML5Backend)(FormEditor);
