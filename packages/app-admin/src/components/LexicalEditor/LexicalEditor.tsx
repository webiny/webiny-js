import React from "react";
import { RichTextEditorProps } from "@webiny/ui/RichTextEditor";
import { FileManager } from "~/components";
import { RichTextContentEditor } from "@webiny/lexical-editor";
import theme from "theme/theme";

export const LexicalEditor: React.FC<RichTextEditorProps> = props => {
    return (
        <FileManager>
            {({ showFileManager }) => (
                <RichTextContentEditor
                    theme={theme}
                    value={JSON.stringify(props.value)}
                    onChange={(jsonString: string) => {
                        if (props?.onChange) {
                            props?.onChange(JSON.parse(jsonString));
                        }
                    }}
                    height={400}
                    width={"100%"}
                    placeholder={"Please add content"}
                    styles={{ backgroundColor: "#e1e1e1", borderBottom: "1px solid #000" }}
                />
            )}
        </FileManager>
    );
};
