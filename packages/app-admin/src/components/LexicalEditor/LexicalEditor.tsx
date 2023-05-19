import React from "react";
import { RichTextEditorProps } from "@webiny/ui/RichTextEditor";
import { FileManager } from "~/components";
import { RichTextEditor } from "@webiny/lexical-editor";
import theme from "theme/theme";

export const LexicalEditor: React.FC<RichTextEditorProps> = props => {
    return (
        <FileManager>
            {({ showFileManager }) => (
                <RichTextEditor
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
                />
            )}
        </FileManager>
    );
};
