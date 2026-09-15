import React from "react";
import { AuditLogsListConfig } from "~/config/list/index.js";
import { SystemPromptTab } from "./SystemPromptTab.js";
import { UserPromptTab } from "./UserPromptTab.js";
import { LlmResponseTab } from "./LlmResponseTab.js";
import { isAiGenerateText, hasAfter } from "./shared.js";

export const AiPromptPreviewTabs = () => {
    return (
        <AuditLogsListConfig>
            <AuditLogsListConfig.Details.Tab
                name="systemPrompt"
                label="System Prompt"
                element={<SystemPromptTab />}
                canRender={isAiGenerateText}
            />
            <AuditLogsListConfig.Details.Tab
                name="userPrompt"
                label="User Prompt"
                element={<UserPromptTab />}
                canRender={isAiGenerateText}
            />
            <AuditLogsListConfig.Details.Tab
                name="llmResponse"
                label="LLM Response"
                element={<LlmResponseTab />}
                canRender={hasAfter}
            />
        </AuditLogsListConfig>
    );
};
