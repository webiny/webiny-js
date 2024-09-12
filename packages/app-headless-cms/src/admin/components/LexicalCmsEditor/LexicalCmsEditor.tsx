import React, { useCallback } from "react";
import { StaticToolbar } from "@webiny/lexical-editor";
import { RichTextEditorProps } from "@webiny/lexical-editor/types";
import { CompositionScope } from "@webiny/react-composition";
import { LexicalEditor } from "@webiny/app-admin/components/LexicalEditor";

const placeholderStyles: React.CSSProperties = { position: "absolute", top: 40, left: 25 };

const contentEditableStyles: React.CSSProperties = {
    minHeight: 200,
    display: "block",
    padding: 10
};

const styles: React.CSSProperties = {
    backgroundColor: "#fff",
    border: "1px solid #e1e1e1",
    padding: "10px 14px",
    minHeight: 200,
    maxHeight: 350
};

const toolbar = (
    <CompositionScope name={"cms"}>
        <StaticToolbar />
    </CompositionScope>
);

export const LexicalCmsEditor = (props: Omit<RichTextEditorProps, "theme">) => {
    const onChange = useCallback(
        (jsonString: string) => {
            if (props?.onChange) {
                props?.onChange(JSON.parse(jsonString));
            }
        },
        [props?.onChange]
    );

    return (
        <LexicalEditor
            {...props}
            focus={true}
            value={props.value ? JSON.stringify(props.value) : props.value}
            onChange={onChange}
            staticToolbar={toolbar}
            tag={"p"}
            placeholder={props?.placeholder || "Enter your text here..."}
            placeholderStyles={placeholderStyles}
            contentEditableStyles={contentEditableStyles}
            styles={styles}
        />
    );
};
