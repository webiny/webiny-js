import React from "react";
import { observer } from "mobx-react-lite";
import { CodeEditor } from "@webiny/admin-ui";
import type { IFieldVM } from "~/features/formModel/abstractions.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        codeEditor: {
            fieldType: "text";
            settings: { language?: string; height?: number };
        };
    }
}

export const CodeEditorRenderer = observer(({ field }: { field: IFieldVM }) => {
    const settings = field.rendererSettings as { language?: string; height?: number } | undefined;

    return (
        <div className={"border-1 border-neutral-dimmed"}>
            <CodeEditor
                value={(field.value as string) ?? ""}
                height={settings?.height ?? 400}
                onChange={value => field.onChange(value)}
                language={settings?.language ?? "html"}
            />
        </div>
    );
});
