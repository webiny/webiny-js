import React from "react";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete_outline.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { StaticToolbar } from "@webiny/lexical-editor";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { LexicalEditor } from "~/components/LexicalEditor/LexicalEditor.js";
import type { RichTextValueWithHtml } from "~/components/LexicalEditor/lexicalValueWithHtml.js";
import {
    Button,
    FormComponentDescription,
    FormComponentErrorMessage,
    FormComponentNote,
    IconButton,
    Separator
} from "@webiny/admin-ui";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        lexicalEditors: {
            fieldType: "lexical";
            settings?: { addItemLabel?: string };
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

export const LexicalEditorsRenderer = createFieldRenderer<"lexicalEditors">(({ field }) => {
    const values = (field.value as RichTextValueWithHtml[]) ?? [];

    const updateAt = (index: number, val: RichTextValueWithHtml | undefined) => {
        const next = [...values];
        next[index] = val as RichTextValueWithHtml;
        field.onChange(next);
    };

    return (
        <div className={"flex flex-col gap-sm"}>
            <Separator labelPosition={"start"} variant={"accent"}>
                <span className={"text-accent-primary text-lg font-semibold"}>
                    {`${field.label ?? ""} ${values.length ? `(${values.length})` : ""}`}
                </span>
            </Separator>
            {field.description && <FormComponentDescription text={field.description} />}
            {values.map((val, index) => (
                <div key={index} className={"relative"}>
                    <LexicalEditor
                        placeholder={field.placeholder || "Enter your text here..."}
                        staticToolbar={<StaticToolbar />}
                        placeholderStyles={placeholderStyles}
                        contentEditableStyles={contentEditableStyles}
                        styles={styles}
                        value={val}
                        onChange={value => updateAt(index, value as RichTextValueWithHtml)}
                    />
                    <div className={"absolute top-sm right-sm z-10"}>
                        <IconButton
                            variant={"ghost"}
                            size={"md"}
                            icon={<DeleteIcon />}
                            onClick={() => field.removeItem(index)}
                        />
                    </div>
                </div>
            ))}
            <Button
                disabled={field.disabled}
                variant={"tertiary"}
                icon={<AddIcon />}
                text={field.rendererSettings?.addItemLabel ?? "Add Value"}
                onClick={() => field.addItem(undefined)}
            />
            {field.note ? <FormComponentNote text={field.note} disabled={field.disabled} /> : null}
            <FormComponentErrorMessage
                text={field.validation.message}
                invalid={field.validation.isValid === false}
                disabled={field.disabled}
            />
        </div>
    );
});
