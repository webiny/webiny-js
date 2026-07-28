import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "~/presentation/breadcrumbs/index.js";
import type { BreadcrumbTrailItem } from "~/presentation/breadcrumbs/index.js";
import { Routes } from "~/presentation/accessManagement/routes.js";

/**
 * Static breadcrumb trail for the teams list: `Access Management › Teams`. The home entry is
 * prepended by the header.
 */
class TeamsBreadcrumbImpl implements Breadcrumb.Interface {
    name = "accessManagement.teams";
    route = Routes.Teams.List;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Access Management" }, { label: "Teams" }];
    }
}

export const TeamsBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: TeamsBreadcrumbImpl,
    dependencies: []
});
