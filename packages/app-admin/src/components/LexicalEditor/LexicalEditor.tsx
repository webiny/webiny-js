import React from "react";
import { FileManager } from "~/components";
import { RichTextEditor as BaseEditor } from "@webiny/lexical-editor";
import { Theme } from "@webiny/app-theme/types";
import { RichTextEditorProps } from "@webiny/lexical-editor/types";
import { usePageElements } from "@webiny/app-page-builder-elements";
interface lexicalEditorProps extends Omit<RichTextEditorProps, "theme"> {
    theme?: Theme;
}

export const LexicalEditor = (props: lexicalEditorProps) => {
    const { theme } = usePageElements();
    return (
        <FileManager>
            {({ showFileManager }) => (
                <BaseEditor
                    {...props}
                    theme={{ ...theme, ...props?.theme }}
                    toolbarActionPlugins={[
                        ...(props.toolbarActionPlugins || []),
                        { targetAction: "image-action", plugin: showFileManager }
                    ]}
                />
            )}
        </FileManager>
    );
};
