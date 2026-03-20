import React from "react";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { DevToolsSection } from "@webiny/app-admin";
import type { EditorDocument } from "@webiny/website-builder-sdk";
import type { Editor } from "~/editorSdk/Editor.js";

function BaseStateInspector<TDocument extends EditorDocument>({
    editor
}: {
    editor: Editor<TDocument>;
}) {
    // toJS() deep-reads every observable property, which makes MobX
    // track them all and re-render this observer when anything changes.
    const document = toJS(editor.getDocumentState().read());
    const editorState = toJS(editor.getEditorState().read());

    return (
        <>
            <DevToolsSection
                name={"Document State"}
                group={"WB Page Editor"}
                data={document}
                views={"raw"}
            />
            <DevToolsSection
                name={"Editor State"}
                group={"WB Page Editor"}
                data={editorState}
                views={"raw"}
            />
        </>
    );
}

export const StateInspector = observer(BaseStateInspector);
