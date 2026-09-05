import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { Command } from "../abstractions.js";

/**
 * Discoverable entry point for the palette's AI mode.
 *
 * Intentionally has NO `detailView`: the design keeps one input row across every mode, so the palette
 * itself owns AI mode and intercepts this command by name. Registering it as a command keeps it
 * searchable ("ai", "ask", "assistant") for people who never learn the space shortcut.
 */
class AskAiCommandImpl implements Command.Interface {
    name = "admin.ai.ask";
    label = "Ask AI";
    description = "Ask about your content in plain language";
    category = "Assistant";
    keywords = ["ai", "ask", "assistant", "chat", "search"];
    icon = <Icon icon={<AiIcon />} size="sm" color="neutral-strong" label="" />;

    // Handled by the palette, which switches into AI mode rather than running an action.
    execute() {
        return;
    }
}

export const AskAiCommand = Command.createImplementation({
    implementation: AskAiCommandImpl,
    dependencies: []
});
