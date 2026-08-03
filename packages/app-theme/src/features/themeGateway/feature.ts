import { createFeature } from "@webiny/feature/admin";
import { ThemeGateway as GatewayAbstraction } from "./abstractions.js";
import { ThemeGateway } from "./ThemeGraphQLGateway.js";

export const ThemeGatewayFeature = createFeature({
    name: "Theme/ThemeGateway",
    register(container) {
        container.register(ThemeGateway).inSingletonScope();
    },
    resolve(container) {
        return { gateway: container.resolve(GatewayAbstraction) };
    }
});
