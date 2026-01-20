import React from "react";
import { FileManager } from "~/components/index.js";
import { RichTextEditor as BaseEditor } from "@webiny/lexical-editor";
import type { RichTextEditorProps } from "@webiny/lexical-editor/types.js";
import { useAdminConfig } from "~/config/AdminConfig.js";

interface LexicalEditorProps extends Omit<RichTextEditorProps, "theme"> {}

const imagesOnly = ["image/*"];

export const LexicalEditor = (props: LexicalEditorProps) => {
    const { lexicalTheme } = useAdminConfig();

    return (
        <FileManager
            accept={imagesOnly}
            render={({ showFileManager }) => (
                <BaseEditor
                    {...props}
                    theme={lexicalTheme}
                    toolbarActionPlugins={[
                        ...(props.toolbarActionPlugins || []),
                        { targetAction: "image-action", plugin: showFileManager }
                    ]}
                />
            )}
        />
    );
};
