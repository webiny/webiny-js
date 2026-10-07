import type { Container } from "@webiny/feature/api";
import { createFeature } from "@webiny/feature/api";
import { DashboardModel } from "~/domain/DashboardModel.js";
import { DashboardModelProvider } from "~/domain/DashboardModelProvider.js";
import { GetMyDashboardFeature } from "~/features/GetMyDashboard/index.js";
import { SaveMyDashboardFeature } from "~/features/SaveMyDashboard/index.js";
import { DashboardGraphQLSchema } from "~/graphql/DashboardGraphQLSchema.js";

/**
 * Stores each identity's admin dashboard layout in a private CMS model. Each entry references its
 * owner, so users and identities don't need to know dashboards exist.
 */
export const DashboardAppFeature = createFeature({
    name: "DashboardApp",
    register(container: Container) {
        container.register(DashboardModel);
        container.register(DashboardModelProvider);
        GetMyDashboardFeature.register(container);
        SaveMyDashboardFeature.register(container);
        container.register(DashboardGraphQLSchema);
    }
});
