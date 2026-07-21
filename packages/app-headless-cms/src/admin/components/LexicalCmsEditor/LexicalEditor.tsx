import React from "react";
import { StaticToolbar } from "@webiny/lexical-editor";
import { LexicalEditor as BaseLexicalEditor } from "@webiny/app-admin";

const placeholderStyles: React.CSSProperties = { position: "absolute", top: 40, left: 25 };

const contentEditableStyles: React.CSSProperties = {
    minHeight: 200,
    display: "block",
    padding: 10
};

const styles: React.CSSProperties = {
    backgroundColor: "var(--color-neutral-base)",
    border: "1px solid var(--border-color-neutral-dimmed)",
    // The static toolbar sits directly above and carries the top border + divider,
    // so the body drops its top border and rounds only the bottom corners. Together
    // they read as a single rounded container.
    borderTop: "none",
    borderRadius: "0 0 var(--radius-md) var(--radius-md)",
    padding: "10px 14px",
    minHeight: 200,
    maxHeight: 350
};

const toolbar = <StaticToolbar />;

export type LexicalEditorProps = Omit<BaseLexicalEditor.Props, "theme">;

export const LexicalEditor = (props: LexicalEditorProps) => {
    return (
        <BaseLexicalEditor
            {...props}
            focus={true}
            staticToolbar={toolbar}
            tag={"p"}
            placeholder={props?.placeholder || "Enter your text here..."}
            placeholderStyles={placeholderStyles}
            contentEditableStyles={contentEditableStyles}
            styles={styles}
        />
    );
};
