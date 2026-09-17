import { SYSTEM_PROMPT } from "@webiny/ai-chat/api/index.js";
import { AiCapability } from "~/api/features/Capabilities/index.js";

export const AI_CHAT_CAPABILITY = "admin.aiChat";

/**
 * The assistant behind the admin command palette.
 *
 * `guidance` is the prompt `@webiny/ai-chat` ships, imported rather than restated so the two cannot
 * drift. Unlike most capabilities this one is safe to append to freely: its output is prose for a
 * human, not a shape the surrounding code parses. House rules ("our product is spelled like this",
 * "never mention internal model ids") belong here.
 *
 * `standard` rather than `fast`: the assistant chains tool calls and has to reason about which model
 * to describe before it can query anything, which is where small models fall down.
 */
class AiChatCapabilityImpl implements AiCapability.Interface {
    readonly id = AI_CHAT_CAPABILITY;
    readonly label = "Admin assistant";
    readonly description =
        "Answers questions about the project's content in the command palette, and proposes changes for approval. Needs a model that handles tool calling well.";
    readonly defaultRole = "standard" as const;
    readonly guidance = SYSTEM_PROMPT;
}

export const AiChatCapability = AiCapability.createImplementation({
    implementation: AiChatCapabilityImpl,
    dependencies: []
});
