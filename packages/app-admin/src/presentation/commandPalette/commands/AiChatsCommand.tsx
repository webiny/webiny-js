import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { AiChatsPanelPresenter } from "~/presentation/aiChats/abstractions.js";
import { Command } from "../abstractions.js";

/**
 * Opens the AI chats panel on the saved chats, or closes it. Also bound to mod+j, so the panel is
 * one key away without the palette.
 */
class AiChatsCommandImpl implements Command.Interface {
    name = "admin.ai.chats";
    label = "AI chats";
    description = "Browse saved conversations";
    category = "Assistant";
    keywords = ["ai", "chats", "assistant", "history", "conversations"];
    icon = <Icon icon={<AiIcon />} size="sm" color="neutral-strong" label="" />;
    shortcut = "mod+j";
    requiresAssistant = true;

    constructor(private panel: AiChatsPanelPresenter.Interface) {}

    execute(): void {
        this.panel.toggleHistory();
    }
}

export const AiChatsCommand = Command.createImplementation({
    implementation: AiChatsCommandImpl,
    dependencies: [AiChatsPanelPresenter]
});
