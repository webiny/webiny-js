import React from "react";
import { StaticToolbar } from "@webiny/lexical-editor";
import { LexicalEditor as BaseLexicalEditor } from "@webiny/app-admin";

// Overlay the contentEditable: same origin + same padding as `contentEditableStyles`, and
// neutralize the Placeholder component's default -20px margin. This makes the placeholder's
// first line land exactly on the editor's text start.
const placeholderStyles: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    padding: "8px 12px",
    marginTop: 0,
    // Font size/family come from the paragraph typography class (applied by RichTextEditor);
    // keep the placeholder muted.
    color: "var(--text-color-neutral-muted)"
};

const contentEditableStyles: React.CSSProperties = {
    minHeight: 200,
    display: "block",
    padding: "8px 12px"
};

const styles: React.CSSProperties = {
    backgroundColor: "var(--color-neutral-base)",
    // Must be set alongside the background: without it the text falls back to whatever it
    // can inherit, which left black text on a dark surface. A typography class from the
    // website theme still wins over this, so WYSIWYG previews are unaffected.
    color: "var(--text-color-neutral-primary)",
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
