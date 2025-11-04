import React, { useEffect, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import { Button } from "@webiny/admin-ui";
import { useDialogs } from "@webiny/app-admin";
import type { GenericFormData } from "@webiny/form";
import { Bind } from "@webiny/form";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { autorun, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import type { EditorDocument } from "@webiny/website-builder-sdk";

const monacoOptions = { minimap: { enabled: false } };

const DialogForm = () => {
    return (
        <Bind name={"state"}>
            {({ value, onChange }) => (
                <div style={{ height: "60vh" }}>
                    <MonacoEditor
                        language={"json"}
                        defaultValue={value}
                        options={monacoOptions}
                        onChange={onChange}
                    />
                </div>
            )}
        </Bind>
    );
};

export const DocumentStateEditor = observer(() => {
    const dialog = useDialogs();
    const editor = useDocumentEditor<EditorDocument>();
    const [state, setState] = useState(() =>
        JSON.stringify(toJS(editor.getDocumentState().read().state), null, 2)
    );

    useEffect(() => {
        autorun(() => {
            const state = editor.getDocumentState().read().state;
            setState(JSON.stringify(toJS(state), null, 2));
        });
    }, []);

    const openDialog = () => {
        dialog.showDialog({
            title: "Document State",
            content: <DialogForm key={state} />,
            formData: {
                state
            },
            acceptLabel: "Save State",
            cancelLabel: "Cancel",
            onAccept: ({ state }: GenericFormData) => {
                editor.updateDocument(document => {
                    document.state = JSON.parse(state);
                });
            }
        });
    };

    return (
        <Button
            className="absolute bottom-0 w-full"
            variant="secondary"
            onClick={openDialog}
            text="Edit State"
        />
    );
});
