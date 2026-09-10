import { createFeature } from "@webiny/feature/admin";
import { RemoteComponentGraphQLGateway } from "./RemoteComponentGraphQLGateway.js";

export const RemoteComponentGatewayFeature = createFeature({
    name: "RemoteComponents/Gateway",
    register(container) {
        container.register(RemoteComponentGraphQLGateway).inSingletonScope();
    },
    resolve() {
        return {};
    }
});
