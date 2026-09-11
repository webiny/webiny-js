import { createFeature } from "@webiny/feature/admin";
import { ActivityLogGatewayImplementation } from "~/gateway/ActivityLogGateway.js";
import {
    ActivityPanelPresenter,
    ActivityPanelPresenterImplementation
} from "~/panel/ActivityPanelPresenter.js";

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
