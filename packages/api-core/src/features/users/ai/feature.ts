import { createFeature } from "@webiny/feature/api";
import { ListUsersTool } from "./ListUsersTool.js";
import { UpdateUserAccessTool } from "./UpdateUserAccessTool.js";

/**
 * Admin user tools for AI callers.
 *
 * There is no create or delete tool. A user's sign-in account lives with the identity provider
 * (Cognito, self-hosted sign-in), which wraps the api-core use cases with its own. Creating or deleting
 * through api-core alone would leave a user who cannot sign in, or a sign-in account with no user.
 */
export const UsersAiToolsFeature = createFeature({
    name: "AdminUsers/AiTools",
    register(container) {
        container.register(ListUsersTool);
        container.register(UpdateUserAccessTool);
    }
});
