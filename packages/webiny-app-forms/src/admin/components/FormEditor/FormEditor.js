import React from "react";
import classSet from "classnames";
import HTML5Backend from "react-dnd-html5-backend";
import { DragDropContext } from "react-dnd";

// Components
import EditorBar from "./Bar";
import EditorContent from "./Content";
import DragPreview from "./DragPreview";

const FormEditor = () => {
    const classes = {
        "form-editor": true
    };
    return (
        <div className={classSet(classes)}>
            <EditorBar />
            <EditorContent />
            <DragPreview />
        </div>
    );
};

export default DragDropContext(HTML5Backend)(FormEditor);
