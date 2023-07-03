import React from "react";
import { StaticToolbar } from "@webiny/lexical-editor";
import { RichTextEditorProps } from "@webiny/lexical-editor/types";
import { CompositionScope } from "@webiny/react-composition";
import { LexicalEditor } from "@webiny/app-admin/components/LexicalEditor";

export const LexicalCmsEditor = (props: Omit<RichTextEditorProps, "theme">) => {
    return (
        <LexicalEditor
            {...props}
            focus={true}
            value={JSON.stringify(props.value)}
            onChange={(jsonString: string) => {
                if (props?.onChange) {
                    props?.onChange(JSON.parse(jsonString));
                }
            }}
            staticToolbar={
                <CompositionScope name={"cms"}>
                    <StaticToolbar />
                </CompositionScope>
            }
            tag={"p"}
            placeholder={props?.placeholder || "Enter your text here..."}
            placeholderStyles={{ position: "absolute", top: 90, left: 25 }}
            contentEditableStyles={{ minHeight: 200, display: "block", padding: 10 }}
            styles={{
                backgroundColor: "#fff",
                border: "1px solid #e1e1e1",
                padding: "10px 14px",
                minHeight: 200,
                maxHeight: 350
            }}
        />
    );
};
