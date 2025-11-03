import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { DeleteTenantUseCase } from "./DeleteTenantUseCase.js";
import { DeleteTenantRepository } from "./DeleteTenantRepository.js";
import { DeleteTenantGateway } from "./DeleteTenantGateway.js";
import { DeleteTenantWithWcpDecrement } from "./decorators/DeleteTenantWithWcpDecrement.js";

export const DeleteTenantFeature = createFeature({
    name: "DeleteTenant",
    register(container: Container) {
        container.register(DeleteTenantUseCase);
        container.register(DeleteTenantRepository).inSingletonScope();
        container.register(DeleteTenantGateway).inSingletonScope();
        container.registerDecorator(DeleteTenantWithWcpDecrement);
    }
});
