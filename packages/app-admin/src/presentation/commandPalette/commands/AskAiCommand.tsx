import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { Command } from "../abstractions.js";

/**
 * Discoverable entry point for the palette's AI mode.
 *
 * `entersAiMode` rather than `execute`: the design keeps one input row across every mode, so selecting
 * this switches the palette instead of running an action, and the palette stays open. A command
 * without a `detailView` is otherwise executed and then closed, which a mode cannot survive.
 *
 * It exists as a command at all so it stays searchable ("ai", "ask", "assistant") for people who
 * never learn the space shortcut.
 */
class AskAiCommandImpl implements Command.Interface {
    name = "admin.ai.ask";
    label = "Ask AI";
    description = "Ask about your content in plain language";
    category = "Assistant";
    keywords = ["ai", "ask", "assistant", "chat", "search"];
    icon = <Icon icon={<AiIcon />} size="sm" color="neutral-strong" label="" />;
    entersAiMode = true;
}

export const AskAiCommand = Command.createImplementation({
    implementation: AskAiCommandImpl,
    dependencies: []
});
