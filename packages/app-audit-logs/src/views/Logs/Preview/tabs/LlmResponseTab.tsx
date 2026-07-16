import React from "react";
import { CodeEditor } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { useAuditLogDetailsPresenter } from "~/views/Logs/Preview/feature.js";
import { EDITOR_HEIGHT, type AiAuditPayload } from "./shared.js";

export const LlmResponseTab = createReactiveComponent(() => {
    const presenter = useAuditLogDetailsPresenter();
    const after = presenter.vm.content.after as AiAuditPayload["after"];

    if (!after) {
        return (
            <CodeEditor
                language="markdown"
                value="(pending — no response yet)"
                height={EDITOR_HEIGHT}
            />
        );
    }

    if (after.status === "error") {
        const errorText = [
            `# Error: ${after.error?.name ?? "Unknown"}`,
            "",
            after.error?.message ?? "No error message available.",
            "",
            after.duration != null ? `Duration: ${after.duration}ms` : ""
        ].join("\n");

        return <CodeEditor language="markdown" value={errorText} height={EDITOR_HEIGHT} />;
    }

    const text = after.text ?? "";
    let formatted = text;
    try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
        // not JSON, show as-is
    }

    return <CodeEditor language="json" value={formatted} height={EDITOR_HEIGHT} />;
});
