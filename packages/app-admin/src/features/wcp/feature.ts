import { createFeature } from "@webiny/app";
import { Container } from "@webiny/di-container";
import { WcpService as WcpServiceAbstraction } from "./abstractions.js";
import { WcpService } from "./WcpService.js";
import { WcpGateway } from "./WcpGateway.js";

export const WcpFeature = createFeature({
    name: "Wcp",
    register(container: Container) {
        container.register(WcpGateway).inSingletonScope();
        container.register(WcpService).inSingletonScope();
    },
    resolve(container: Container) {
        return {
            service: container.resolve(WcpServiceAbstraction)
        };
    }
});
