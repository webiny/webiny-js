import { createFeature } from "@webiny/feature/admin";
import { CurrentTenantPresenter as PresenterAbstraction } from "./abstractions.js";
import { CurrentTenantPresenter } from "./CurrentTenantPresenter.js";
import { CurrentTenantRepository } from "./CurrentTenantRepository.js";
import { CurrentTenantGateway } from "./CurrentTenantGateway.js";

export const CurrentTenantFeature = createFeature({
    name: "CurrentTenant",
    register(container) {
        container.register(CurrentTenantPresenter);
        container.register(CurrentTenantRepository).inSingletonScope();
        container.register(CurrentTenantGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
