import React from "react";
import { DocumentEditor } from "~/DocumentEditor/DocumentEditor.js";
import { CompositionScope } from "@webiny/app-admin";
import emptyPage from "~/sdk/mocks/emptyPage";

export const PageEditor = () => {
    return (
        <CompositionScope name={"websiteBuilder"}>
            <DocumentEditor document={emptyPage}>
                {/*<EditorConfig>
                <EditorConfig.Ui.Content.Element
                    name={"debugger"}
                    element={<EditorStateDebugger />}
                />
            </EditorConfig>*/}
            </DocumentEditor>
        </CompositionScope>
    );
};
