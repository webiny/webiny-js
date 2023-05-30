import React from "react";
import { RichTextEditorProps } from "@webiny/ui/RichTextEditor";
import { FileManager } from "~/components";
import { LexicalCmsEditor } from "@webiny/lexical-editor-cms-actions";

export const LexicalEditor: React.FC<RichTextEditorProps> = props => {
    return (
        <FileManager>
            {({ showFileManager }) => (
                <LexicalCmsEditor
                    value={JSON.stringify(props.value)}
                    onChange={(jsonString: string) => {
                        if (props?.onChange) {
                            props?.onChange(JSON.parse(jsonString));
                        }
                    }}
                    placeholder={"Please add content"}
                    styles={{
                        backgroundColor: "#fff",
                        border: "1px solid #e1e1e1",
                        minHeight: 250,
                        padding: "10px 14px"
                    }}
                    toolbarActionPlugins={[{ type: "image-action", plugin: showFileManager }]}
                />
            )}
        </FileManager>
    );
};
