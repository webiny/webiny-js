import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

/**
 * Static breadcrumb trail for the SDK Playground page: `Dev Tools › SDK Playground`. The home
 * entry is prepended by the header.
 */
class SdkPlaygroundBreadcrumbImpl implements Breadcrumb.Interface {
    name = "devTools.sdkPlayground";
    route = Routes.SdkPlayground;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Dev Tools" }, { label: "SDK Playground" }];
    }
}

export const SdkPlaygroundBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: SdkPlaygroundBreadcrumbImpl,
    dependencies: []
});
