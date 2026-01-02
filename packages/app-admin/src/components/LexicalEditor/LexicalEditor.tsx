import React from "react";
import { FileManager } from "~/components/index.js";
import { RichTextEditor as BaseEditor } from "@webiny/lexical-editor";
import type { RichTextEditorProps } from "@webiny/lexical-editor/types.js";
// TODO: import { useTheme } from "@webiny/app-theme";
import type { EditorTheme } from "@webiny/lexical-theme";

interface LexicalEditorProps extends Omit<RichTextEditorProps, "theme"> {
    theme?: Partial<EditorTheme>;
}

const imagesOnly = ["image/*"];

export const LexicalEditor = (props: LexicalEditorProps) => {
    // const { theme } = useTheme();
    //
    const editorTheme: EditorTheme = {
        styles: {},
        emotionMap: {},
        // TODO:  ...theme,
        ...(props.theme || {})
    };

    return (
        <FileManager
            accept={imagesOnly}
            render={({ showFileManager }) => (
                <BaseEditor
                    {...props}
                    theme={editorTheme}
                    toolbarActionPlugins={[
                        ...(props.toolbarActionPlugins || []),
                        { targetAction: "image-action", plugin: showFileManager }
                    ]}
                />
            )}
        />
    );
};
