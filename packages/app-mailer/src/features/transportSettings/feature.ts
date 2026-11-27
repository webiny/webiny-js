import { createFeature } from "@webiny/feature/admin";
import { TransportSettingsGateway as GatewayAbstraction } from "./abstractions.js";
import { TransportSettingsGateway } from "./TransportSettingsGateway.js";

export const TransportSettingsFeature = createFeature({
    name: "Mailer/TransportSettings",
    register(container) {
        container.register(TransportSettingsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            gateway: container.resolve(GatewayAbstraction)
        };
    }
});
