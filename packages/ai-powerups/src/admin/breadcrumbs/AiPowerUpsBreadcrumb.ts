import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/admin/routes.js";

/**
 * Static breadcrumb trail for the AI Power-Ups settings page: `AI Power-Ups`. The home entry
 * is prepended by the header.
 */
class AiPowerUpsBreadcrumbImpl implements Breadcrumb.Interface {
    name = "aiPowerUps.settings";
    route = Routes.Settings;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "AI Power-Ups" }];
    }
}

export const AiPowerUpsBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: AiPowerUpsBreadcrumbImpl,
    dependencies: []
});
