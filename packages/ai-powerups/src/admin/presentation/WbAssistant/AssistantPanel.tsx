import React from "react";
import { AiChatsPanelRenderer } from "@webiny/app-admin";
import { Editor } from "@webiny/app-website-builder";

export const ASSISTANT_PANEL = "aiAssistant";

/**
 * The AI chats panel as an editor panel. The rail decides when it shows; the panel's own close
 * button closes its tab.
 */
export const AssistantPanel = () => {
    const panel = Editor.usePanel(ASSISTANT_PANEL);

    return (
        <div data-affects-preview={"width"} className={"relative h-full flex-none"}>
            <AiChatsPanelRenderer className={"h-full"} width={400} onClose={panel.close} />
        </div>
    );
};
