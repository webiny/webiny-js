import React from "react";
import { StaticToolbar } from "@webiny/lexical-editor";
import { LexicalEditor as BaseLexicalEditor } from "@webiny/app-admin";

// marginTop overrides the Placeholder component's default -20px so the placeholder aligns
// with the contentEditable's text start (its 8px/12px padding).
const placeholderStyles: React.CSSProperties = {
    position: "absolute",
    top: 8,
    left: 8,
    marginTop: 0
};

const contentEditableStyles: React.CSSProperties = {
    minHeight: 200,
    display: "block",
    padding: "8px 12px"
};

const styles: React.CSSProperties = {
    backgroundColor: "var(--color-neutral-base)",
    border: "1px solid var(--border-color-neutral-muted)",
    // The static toolbar sits directly above and carries the top border, so the body
    // drops its top border and rounds only the bottom corners — together one seamless
    // rounded container, no internal divider (matches Figma).
    borderTop: "none",
    borderRadius: "0 0 var(--radius-md) var(--radius-md)",
    // Padding lives on the contentEditable only (avoids doubled inset).
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
