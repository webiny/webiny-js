import React from "react";
import { AiChatsPanelRenderer } from "@webiny/app-admin";
import type { AiChatsPanelProps } from "@webiny/app-admin";
import { AiChatsPanel } from "./AiChatsPanel.js";

/** The AI chats panel, for screens outside the admin frame that render `AiChatsPanelRenderer`. */
export const AiChatsPanelDecorator = AiChatsPanelRenderer.createDecorator(() => {
    return function AiChatsPanelRendererImpl(props: AiChatsPanelProps) {
        return <AiChatsPanel {...props} />;
    };
});
