import React, { useCallback } from "react";
import { useAdminConfig } from "@webiny/app-admin";
import type { BreadcrumbLink } from "@webiny/app-admin";
import { useContainer } from "@webiny/app";
import { RouterGateway } from "@webiny/app/features/router/abstractions.js";
import { RouterPresenter } from "@webiny/app/features/router/abstractions.js";
import { Breadcrumbs as BreadcrumbsUI } from "@webiny/admin-ui";
import { createHomeBreadcrumbItem } from "@webiny/admin-ui";
import type { BreadcrumbsItem } from "@webiny/admin-ui";

const HOME_PATH = "/";

/**
 * Header breadcrumbs. Reads the trail from the React Config API (`useAdminConfig().breadcrumbs`,
 * populated by mounted `<Breadcrumb>` components), prepends the home entry, and renders the
 * design-system primitive. Re-renders automatically as views mount/unmount their breadcrumbs.
 */
export const Breadcrumbs = () => {
    const { breadcrumbs } = useAdminConfig();
    const container = useContainer();

    // Resolves a `to` (string or Route + params) to a concrete href.
    const resolveLink = useCallback(
        (to: BreadcrumbLink): string => {
            if (typeof to === "string") {
                return to;
            }
            const router = container.resolve(RouterPresenter);
            return to.params ? router.getLink(to.route, to.params) : router.getLink(to.route);
        },
        [container]
    );

    const navigateTo = useCallback(
        (to: BreadcrumbLink) => {
            container.resolve(RouterGateway).pushState(resolveLink(to));
        },
        [container, resolveLink]
    );

    // Leading home entry always navigates back to the dashboard.
    const home = createHomeBreadcrumbItem(() => navigateTo(HOME_PATH));

    const locations = breadcrumbs.map<BreadcrumbsItem>((item, index) => {
        const isCurrent = index === breadcrumbs.length - 1;
        const to = item.to;
        return {
            label: item.label,
            icon: item.icon,
            title: item.label,
            current: isCurrent,
            onClick: !isCurrent && to ? () => navigateTo(to) : undefined
        };
    });

    return <BreadcrumbsUI items={[home, ...locations]} />;
};
