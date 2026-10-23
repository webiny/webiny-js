import { createFeature } from "@webiny/feature/admin";
import { ActivityLogGatewayImplementation } from "~/admin/gateway/ActivityLogGateway.js";
import {
    ActivityPanelPresenter,
    ActivityPanelPresenterImplementation
} from "~/admin/panel/ActivityPanelPresenter.js";

export const ActivityLogAdminFeature = createFeature({
    name: "ActivityLog/Admin",
    register(container) {
        container.register(ActivityLogGatewayImplementation).inSingletonScope();
        // Singleton, so the header toggle and the panel share one open/closed state.
        container.register(ActivityPanelPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            panel: container.resolve(ActivityPanelPresenter)
        };
    }
});
