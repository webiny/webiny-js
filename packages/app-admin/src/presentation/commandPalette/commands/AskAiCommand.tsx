import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { Command } from "../abstractions.js";

/**
 * Discoverable entry point for the palette's AI mode.
 *
 * Intentionally has NO `detailView`: the design keeps one input row across every mode, so the palette
 * itself owns AI mode. Registering it as a command keeps it searchable ("ai", "ask", "assistant") for
 * people who never learn the space shortcut.
 *
 * Selecting it does NOT run `execute()`. `CommandPalette.runCommand` compares the name against
 * `AI_COMMAND_NAME` and calls `enterAiMode()` instead of handing it to the presenter, so this is a
 * command in the list-and-search sense only. If more modes ever arrive, a `mode` field on the command
 * would beat matching a name and leaving a method that is never called.
 */
class AskAiCommandImpl implements Command.Interface {
    name = "admin.ai.ask";
    label = "Ask AI";
    description = "Ask about your content in plain language";
    category = "Assistant";
    keywords = ["ai", "ask", "assistant", "chat", "search"];
    icon = <Icon icon={<AiIcon />} size="sm" color="neutral-strong" label="" />;

    // Never called: the palette intercepts this command and enters AI mode instead. Present only
    // because `Command.Interface` requires it.
    execute() {
        return;
    }
}

export const AskAiCommand = Command.createImplementation({
    implementation: AskAiCommandImpl,
    dependencies: []
});
