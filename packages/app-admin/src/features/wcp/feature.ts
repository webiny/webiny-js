import { createFeature } from "@webiny/app";
import { Container } from "@webiny/di-container";
import { WcpService as WcpServiceAbstraction } from "./abstractions";
import { WcpService } from "./WcpService";
import { WcpGateway } from "./WcpGateway";

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
