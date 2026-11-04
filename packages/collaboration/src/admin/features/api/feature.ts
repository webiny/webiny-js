import { createFeature } from "@webiny/feature/admin";
import { CollaborationApi as ApiAbstraction } from "./abstractions.js";
import { CollaborationGateway } from "./CollaborationGateway.js";
import { CollaborationApi } from "./CollaborationApi.js";

export const CollaborationApiFeature = createFeature({
    name: "Collaboration/Api",
    register(container) {
        container.register(CollaborationGateway).inSingletonScope();
        container.register(CollaborationApi).inSingletonScope();
    },
    resolve(container) {
        return {
            api: container.resolve(ApiAbstraction)
        };
    }
});
