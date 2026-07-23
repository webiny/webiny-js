import React from "react";
import { StaticToolbar } from "@webiny/lexical-editor";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { LexicalEditor } from "~/components/LexicalEditor/LexicalEditor.js";
import type { RichTextValueWithHtml } from "~/components/LexicalEditor/lexicalValueWithHtml.js";
import { FormComponentLabel } from "@webiny/admin-ui";
import { FormComponentDescription } from "@webiny/admin-ui";
import { FormComponentNote } from "@webiny/admin-ui";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        lexical: {
            fieldType: "lexical";
            settings: undefined;
        };
    }
}

const placeholderStyles: React.CSSProperties = { position: "absolute", top: 28, left: 13 };

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

export const LexicalRenderer = createFieldRenderer<"lexical">(({ field }) => {
    const value = field.value as RichTextValueWithHtml | undefined;
    const toolbar = <StaticToolbar />;

    return (
        <>
            <FormComponentLabel text={field.label} hint={field.help} disabled={field.disabled} />
            <FormComponentDescription text={field.description} disabled={field.disabled} />
            <LexicalEditor
                placeholder={field.placeholder || "Enter your text here..."}
                staticToolbar={toolbar}
                placeholderStyles={placeholderStyles}
                contentEditableStyles={contentEditableStyles}
                styles={styles}
                value={value}
                onChange={value => field.onChange(value)}
            />
            {field.note ? <FormComponentNote text={field.note} disabled={field.disabled} /> : null}
        </>
    );
});
