import { createFeature } from "@webiny/feature/admin";
import { AdminExtensionsGraphQLGateway } from "./AdminExtensionsGraphQLGateway.js";

export const AdminExtensionsGatewayFeature = createFeature({
    name: "RemoteComponents/AdminExtensionsGateway",
    register(container) {
        container.register(AdminExtensionsGraphQLGateway).inSingletonScope();
    }
});
