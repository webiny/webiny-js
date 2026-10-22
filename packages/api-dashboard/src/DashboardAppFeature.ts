import type { Container } from "@webiny/feature/api";
import { createFeature } from "@webiny/feature/api";
import { ListDashboardsFeature } from "~/features/ListDashboards/index.js";
import { UpdateDashboardFeature } from "~/features/UpdateDashboard/index.js";
import { DashboardGraphQLSchema } from "~/graphql/DashboardGraphQLSchema.js";

/**
 * Stores each identity's admin dashboard layout in the key-value store, keyed by the identity ID,
 * so users and identities don't need to know dashboards exist.
 */
export const DashboardAppFeature = createFeature({
    name: "DashboardApp",
    register(container: Container) {
        ListDashboardsFeature.register(container);
        UpdateDashboardFeature.register(container);
        container.register(DashboardGraphQLSchema);
    }
});
