import { createFeature } from "@webiny/feature/admin";
import { LayoutsGateway } from "./LayoutsGateway.js";
import { LayoutsRepository } from "./LayoutsRepository.js";

/**
 * The repository is shared by all layout operations, so the listed layouts stay in sync as they're created,
 * updated and deleted.
 */
export const SharedLayoutsInfrastructureFeature = createFeature({
    name: "WebsiteBuilder/SharedLayoutsInfrastructure",
    register(container) {
        container.register(LayoutsRepository).inSingletonScope();
        container.register(LayoutsGateway).inSingletonScope();
    }
});
