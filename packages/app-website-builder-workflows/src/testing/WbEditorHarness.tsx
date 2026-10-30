import React from "react";
import type { Container } from "@webiny/di";
import { AdminUiProvider } from "@webiny/admin-ui";
import { DiContainerProvider } from "@webiny/app";
import { CompositionProvider } from "@webiny/react-composition";
import { CompositionScope } from "@webiny/react-composition";
import { DocumentEditorContext } from "@webiny/app-website-builder/DocumentEditor/DocumentEditor.js";
import { EditorWithConfig } from "@webiny/app-website-builder/BaseEditor/config/EditorConfig.js";
import { EDITOR_NAME } from "@webiny/app-website-builder/presentation/pages/PageEditor/constants.js";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import type { Editor } from "@webiny/app-website-builder/editorSdk/Editor.js";
import type { IPageEditorDocument } from "~/Components/PageEditor/pageEditorDocument.js";

const { Ui } = PageEditorConfig;

export interface WbEditorHarnessProps {
    container: Container;
    editor: Editor<IPageEditorDocument>;
    groups?: string[];
    children?: React.ReactNode;
}

export const WbEditorHarness = ({
    container,
    editor,
    groups = [],
    children
}: WbEditorHarnessProps) => {
    return (
        <DiContainerProvider container={container}>
            <AdminUiProvider>
                <CompositionProvider>
                    <DocumentEditorContext.Provider value={editor}>
                        {children}
                        <CompositionScope name={EDITOR_NAME}>
                            <EditorWithConfig>
                                {groups.map(group => (
                                    <Ui.TopBar.Elements key={group} group={group} />
                                ))}
                            </EditorWithConfig>
                        </CompositionScope>
                    </DocumentEditorContext.Provider>
                </CompositionProvider>
            </AdminUiProvider>
        </DiContainerProvider>
    );
};
