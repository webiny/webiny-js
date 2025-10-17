import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { DeleteTenantUseCase } from "./DeleteTenantUseCase.js";
import { DeleteTenantRepository } from "./DeleteTenantRepository.js";
import { DeleteTenantGateway } from "./DeleteTenantGateway.js";

export const DeleteTenantFeature = createFeature({
    name: "DeleteTenant",
    register(container: Container) {
        container.register(DeleteTenantUseCase);
        container.register(DeleteTenantRepository).inSingletonScope();
        container.register(DeleteTenantGateway).inSingletonScope();

        // TODO: Wrap with DeleteTenantWithWcpDecrement decorator
        // when it's implemented in @webiny/api-wcp
    }
});
