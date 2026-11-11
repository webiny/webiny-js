import { createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { AiChatsRepositoryFeature } from "./shared/index.js";
import { ListAiChatsFeature } from "./ListAiChats/index.js";
import { GetAiChatFeature } from "./GetAiChat/index.js";
import { SaveAiChatFeature } from "./SaveAiChat/index.js";
import { DeleteAiChatFeature } from "./DeleteAiChat/index.js";
import { AiChatsGraphQLSchema } from "~/api/graphql/AiChatsGraphQLSchema.js";

/**
 * Saved assistant chats: each identity's conversations, kept so the chats panel can list and reopen
 * them. Stored in the tenant's key-value store as one summary per chat in the owner's collection,
 * plus the messages beside it.
 *
 * Gated on the same flag as the assistant: without it there is nothing to save chats from.
 */
export const AiChatsFeature = createFeature({
    name: "AiPowerUps/AiChats",
    register(container) {
        const enabled = container
            .resolve(FeatureFlags)
            .get()
            .isEnabled("aiPowerups.adminAssistant");

        if (!enabled) {
            return;
        }

        AiChatsRepositoryFeature.register(container);
        ListAiChatsFeature.register(container);
        GetAiChatFeature.register(container);
        SaveAiChatFeature.register(container);
        DeleteAiChatFeature.register(container);
        container.register(AiChatsGraphQLSchema);
    }
});
