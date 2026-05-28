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
