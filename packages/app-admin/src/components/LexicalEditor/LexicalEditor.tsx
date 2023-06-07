import React from "react";
import { FileManager } from "~/components";
import { RichTextEditor as BaseEditor } from "@webiny/lexical-editor";
export const LexicalEditor = (props: React.ComponentProps<typeof BaseEditor>) => {
    return (
        <FileManager>
            {({ showFileManager }) => (
                <BaseEditor
                    {...props}
                    toolbarActionPlugins={[
                        ...(props.toolbarActionPlugins || []),
                        { targetAction: "image-action", plugin: showFileManager }
                    ]}
                />
            )}
        </FileManager>
    );
};
