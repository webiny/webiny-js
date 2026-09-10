import React from "react";
import { CodeEditor } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { useAuditLogDetailsPresenter } from "~/views/Logs/Preview/feature.js";
import { EDITOR_HEIGHT, type AiAuditPayload } from "./shared.js";

function extractSystemPrompt(content: Record<string, unknown>): string {
    const before = content.before as AiAuditPayload["before"];
    const system = before?.system;
    if (typeof system === "string") {
        return system;
    }
    if (system && typeof system.content === "string") {
        return system.content;
    }
    return "";
}

export const SystemPromptTab = createReactiveComponent(() => {
    const presenter = useAuditLogDetailsPresenter();
    const text = extractSystemPrompt(presenter.vm.content);
    return <CodeEditor language="markdown" value={text || "(empty)"} height={EDITOR_HEIGHT} />;
});
