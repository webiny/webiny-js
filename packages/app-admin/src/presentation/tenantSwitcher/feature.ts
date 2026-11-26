import { createFeature } from "@webiny/feature/admin";
import { TenantSwitcherPresenter as Abstraction } from "./abstractions.js";
import { TenantSwitcherPresenter } from "./TenantSwitcherPresenter.js";

export const TenantSwitcherPresenterFeature = createFeature({
    name: "TenantSwitcherPresenter",
    register(container) {
        // Singleton, so the sidebar header and the collapsed rail show the same tenant.
        container.register(TenantSwitcherPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
