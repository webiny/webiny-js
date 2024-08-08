import React from "react";
import { FileManager } from "~/components";
import { RichTextEditor as BaseEditor } from "@webiny/lexical-editor";
import { RichTextEditorProps } from "@webiny/lexical-editor/types";
import { useTheme } from "@webiny/app-theme";
import { Theme } from "@webiny/app-theme/types";

interface LexicalEditorProps extends Omit<RichTextEditorProps, "theme"> {
    theme?: Theme;
}

const imagesOnly = ["image/*"];

export const LexicalEditor = (props: LexicalEditorProps) => {
    const { theme } = useTheme();

    return (
        <FileManager accept={imagesOnly}>
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
