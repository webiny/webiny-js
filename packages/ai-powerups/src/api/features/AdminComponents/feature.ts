import { createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { AdminComponentModelPlugin } from "./adminComponent.model.js";
import { AdminComponentModelProvider } from "./AdminComponentModelProvider.js";
import { AdminComponentsRepository } from "./AdminComponentsRepository.js";
import { CreateFieldRendererTool } from "./CreateFieldRendererTool.js";

/**
 * Admin components: the storage, and the tool the assistant uses to write one.
 *
 * Gated on the same flag as the assistant. The tool is only reachable through the assistant, so a
 * project without it has no use for the storage either, and registering the model anyway would add a
 * model to every tenant for a feature they cannot call.
 */
export const AdminComponentsFeature = createFeature({
    name: "AiPowerUps/AdminComponents",
    register(container) {
        const enabled = container
            .resolve(FeatureFlags)
            .get()
            .isEnabled("aiPowerups.adminAssistant");

        if (!enabled) {
            return;
        }

        container.register(AdminComponentModelPlugin);
        container.register(AdminComponentModelProvider);
        container.register(AdminComponentsRepository);
        container.register(CreateFieldRendererTool);
    }
});
