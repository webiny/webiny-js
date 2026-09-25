import { AiCapability } from "~/api/features/Capabilities/index.js";
import { SYSTEM_PROMPT } from "./systemPrompt.js";

export const ADMIN_ASSISTANT_CAPABILITY = "admin.assistant";

/**
 * The assistant behind the admin command palette.
 *
 * `admin.assistant` matches the WCP licence option and the `aiPowerups.adminAssistant` flag, so the
 * feature has one name everywhere. It is also the name that survives: every other id says what the
 * feature does (`fm.imageEnrichment`, `cms.generateEntry`), and this one deliberately does not do
 * one thing. Today it reads and changes content, and the direction is for it to build things
 * too, like a field renderer or a menu change. The id is the persisted settings key, so a later rename
 * orphans a project's overrides.
 *
 * `guidance` is the prompt this feature ships, imported rather than restated so the two cannot
 * drift. Unlike most capabilities this one is safe to append to freely: its output is prose for a
 * human, not a shape the surrounding code parses. House rules ("our product is spelled like this",
 * "never mention internal model ids") belong here.
 *
 * `standard` rather than `fast`: the assistant chains tool calls and has to reason about which model
 * to describe before it can query anything, which is where small models fall down.
 */
class AdminAssistantCapabilityImpl implements AiCapability.Interface {
    readonly id = ADMIN_ASSISTANT_CAPABILITY;
    readonly label = "Admin assistant";
    readonly description =
        "The assistant in the command palette. Answers questions about this project and proposes changes for approval, under the permissions of whoever is asking. The most open-ended capability here: it plans across several tool calls, so it gains the most from a strong model.";
    readonly defaultRole = "standard" as const;
    readonly guidance = SYSTEM_PROMPT;
}

export const AdminAssistantCapability = AiCapability.createImplementation({
    implementation: AdminAssistantCapabilityImpl,
    dependencies: []
});
