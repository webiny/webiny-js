// @flow
import React from "react";
import Snackbar from "webiny-admin/plugins/Snackbar/Snackbar";
import { FormEditorProvider, FormEditor } from "webiny-app-forms/admin/components/FormEditor";

export default function EditorView() {
    return (
        <React.Fragment>
            <FormEditorProvider>
                <FormEditor />
            </FormEditorProvider>
            <div style={{ zIndex: 10, position: "absolute" }}>
                <Snackbar />
            </div>
        </React.Fragment>
    );
}
