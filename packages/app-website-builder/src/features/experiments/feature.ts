import { createFeature } from "@webiny/feature/admin";
import { ExperimentsGateway as GatewayAbstraction } from "./abstractions.js";
import { ExperimentsGateway } from "./ExperimentsGateway.js";

export const ExperimentsFeature = createFeature({
    name: "WebsiteBuilder/Experiments",
    register(container) {
        container.register(ExperimentsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            gateway: container.resolve(GatewayAbstraction)
        };
    }
});
