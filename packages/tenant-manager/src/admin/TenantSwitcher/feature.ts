import { createFeature } from "@webiny/feature/admin";
import { TenantListGateway } from "./TenantListGateway.js";
import { TenantSwitcherSourceDecorator } from "./TenantSwitcherSourceDecorator.js";

export const TenantSwitcherFeature = createFeature({
    name: "TenantManager/TenantSwitcher",
    register(container) {
        container.register(TenantListGateway).inSingletonScope();
        container.registerDecorator(TenantSwitcherSourceDecorator);
    }
});
