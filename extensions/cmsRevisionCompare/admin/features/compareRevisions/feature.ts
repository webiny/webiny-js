import { createFeature } from "webiny/admin";
import { CompareRevisionsGateway } from "./abstractions.js";
import { CompareRevisionsGatewayImplementation } from "./CompareRevisionsGateway.js";

export const CompareRevisionsGatewayFeature = createFeature({
    name: "CmsRevisionCompare/Gateway",
    register(container) {
        container.register(CompareRevisionsGatewayImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            gateway: container.resolve(CompareRevisionsGateway)
        };
    }
});
