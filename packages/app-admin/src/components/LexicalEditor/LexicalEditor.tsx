import React from "react";
import { RichTextEditorProps } from "@webiny/ui/RichTextEditor";
import { FileManager } from "~/components";
import { LexicalRichTextEditor } from "@webiny/lexical-editor-cms-actions";

export const LexicalEditor: React.FC<RichTextEditorProps> = props => {
    return (
        <FileManager>
            {({ showFileManager }) => (
                <LexicalRichTextEditor
                    value={JSON.stringify(props.value)}
                    onChange={(jsonString: string) => {
                        if (props?.onChange) {
                            props?.onChange(JSON.parse(jsonString));
                        }
                    }}
                    placeholder={"Please add content"}
                    styles={{
                        backgroundColor: "#e1e1e1",
                        borderBottom: "1px solid #000",
                        minHeight: 400
                    }}
                    toolbarActionPlugins={[{ type: "image-action", plugin: showFileManager }]}
                />
            )}
        </FileManager>
    );
};
