// @flow
import React, { useEffect } from "react";
import HTML5Backend from "react-dnd-html5-backend";
import { DragDropContext } from "react-dnd";
import { useFormEditor } from "./context";

// Components
import EditorBar from "./Bar";
import EditorContent from "./Content";
import DragPreview from "./DragPreview";

type Props = {
    id: string
};

const FormEditor = ({ id }: Props) => {
    const {
        getForm,
        state: { loaded }
    } = useFormEditor();
    useEffect(() => {
        getForm(id);
    }, []);

    if (!loaded) {
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
