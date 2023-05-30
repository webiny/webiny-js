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
                    width={"100%"}
                    placeholder={"Please add content"}
                    styles={{
                        backgroundColor: "#fff",
                        borderBottom: "1px solid #000",
                        minHeight: 400
                    }}
                    toolbarActionPlugins={[{ type: "image-action", plugin: showFileManager }]}
                />
            )}
        </FileManager>
    );
};
