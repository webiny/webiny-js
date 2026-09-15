import React from "react";
import { CodeEditor } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { useAuditLogDetailsPresenter } from "~/views/Logs/Preview/feature.js";
import { EDITOR_HEIGHT, type AiAuditPayload } from "./shared.js";

export const UserPromptTab = createReactiveComponent(() => {
    const presenter = useAuditLogDetailsPresenter();
    const before = presenter.vm.content.before as AiAuditPayload["before"];
    const text = before?.prompt ?? "";
    return <CodeEditor language="markdown" value={text || "(empty)"} height={EDITOR_HEIGHT} />;
});
