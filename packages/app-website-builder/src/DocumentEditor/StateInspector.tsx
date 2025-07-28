import React from "react";
import Monaco from "@monaco-editor/react";
import { Tabs } from "@webiny/admin-ui";
import { FloatingPanel } from "@webiny/app-admin/components";
import type { EditorDocument } from "@webiny/website-builder-sdk";
import { Editor } from "~/editorSdk/Editor";
import { observer } from "mobx-react-lite";

const monacoTheme = "vs-light";
const monacoOptions = { minimap: { enabled: false } };

function BaseStateInspector<TDocument extends EditorDocument>({
    editor
}: {
    editor: Editor<TDocument>;
}) {
    const document = editor.getDocumentState().read();
    const editorState = editor.getEditorState().read();

    return (
        <FloatingPanel shortcut={"Cmd+E"} dragHandle={".floating-panel"}>
            {({ height }) => (
                <Tabs
                    size="md"
                    spacing="sm"
                    separator={true}
                    tabs={[
                        <Tabs.Tab
                            key="document"
                            value="document"
                            trigger={"Document"}
                            content={
                                <Monaco
                                    theme={monacoTheme}
                                    height={height - 76}
                                    defaultLanguage={"json"}
                                    value={JSON.stringify(document, null, 2)}
                                    options={monacoOptions}
                                />
                            }
                        />,
                        <Tabs.Tab
                            key="editorState"
                            value="editorState"
                            trigger={"Editor State"}
                            content={
                                <Monaco
                                    theme={monacoTheme}
                                    height={height - 76}
                                    defaultLanguage={"json"}
                                    value={JSON.stringify(editorState, null, 2)}
                                    options={monacoOptions}
                                />
                            }
                        />
                    ]}
                />
            )}
        </FloatingPanel>
    );
}

export const StateInspector = observer(BaseStateInspector);
