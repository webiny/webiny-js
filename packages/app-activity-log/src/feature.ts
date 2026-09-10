import { createFeature } from "@webiny/feature/admin";
import { ActivityLogGatewayImplementation } from "~/gateway/ActivityLogGateway.js";

export const ActivityLogAdminFeature = createFeature({
    name: "ActivityLog/Admin",
    register(container) {
        container.register(ActivityLogGatewayImplementation).inSingletonScope();
    }
});
