import React from "react";
import { RichTextEditor as UiRichTextEditor, RichTextEditorProps } from "@webiny/ui/RichTextEditor";
import { FileManager } from "../FileManager";

export const RichTextEditor = (props: RichTextEditorProps) => {
    return (
        <FileManager>
            {({ showFileManager }) => (
                <UiRichTextEditor
                    placeholder={"Click here to type"}
                    {...props}
                    context={{ ...props.context, showFileManager }}
                />
            )}
        </FileManager>
    );
};
