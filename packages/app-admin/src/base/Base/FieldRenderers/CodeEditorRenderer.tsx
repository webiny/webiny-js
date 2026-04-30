import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { CodeEditor } from "@webiny/admin-ui";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        codeEditor: {
            fieldType: "text";
            settings: { language?: string; height?: number };
        };
    }
}

export const CodeEditorRenderer = createFieldRenderer<"codeEditor">(({ field }) => {
    return (
        <div className={"border-1 border-neutral-dimmed"}>
            <CodeEditor
                value={(field.value as string) ?? ""}
                height={field.rendererSettings?.height ?? 400}
                onChange={value => field.onChange(value)}
                language={field.rendererSettings?.language ?? "html"}
            />
        </div>
    );
});
