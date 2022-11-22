import React from "react";
import { RichTextEditor as UiRichTextEditor, RichTextEditorProps } from "@webiny/ui/RichTextEditor";
import { FileManager } from "~/components";

export const RichTextEditor: React.FC<RichTextEditorProps> = props => {
    return (
        <FileManager>
            {({ showFileManager }) => (
                <UiRichTextEditor
                    {...props}
                    placeholder={props.placeholder || "Click here to type"}
                    context={{ ...props.context, showFileManager }}
                />
            )}
        </FileManager>
    );
};
