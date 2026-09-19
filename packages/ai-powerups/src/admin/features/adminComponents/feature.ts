import { createFeature } from "@webiny/feature/admin";
import { ListAdminComponentsGateway as GatewayAbstraction } from "./abstractions.js";
import { ListAdminComponentsGateway } from "./ListAdminComponentsGateway.js";

export const AdminComponentsFeature = createFeature({
    name: "AiPowerUps/AdminComponents",
    register(container) {
        container.register(ListAdminComponentsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            gateway: container.resolve(GatewayAbstraction)
        };
    }
});
