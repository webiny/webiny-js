import React, { useCallback, useRef } from "react";
import { useAdminConfig } from "@webiny/app-admin";
import type { BreadcrumbConfig, BreadcrumbLink } from "@webiny/app-admin";
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

    // Keep the previous trail visible while a newly-entered view loads its own (dynamic
    // views mount their breadcrumbs only after their data resolves, which would otherwise
    // flash an empty trail). The retained trail is cleared on the dashboard, which is
    // legitimately breadcrumb-less.
    const lastTrail = useRef<BreadcrumbConfig[]>([]);
    const onDashboard = container.resolve(RouterPresenter).vm.currentRoute?.path === HOME_PATH;

    let trail: BreadcrumbConfig[];
    if (breadcrumbs.length > 0) {
        lastTrail.current = breadcrumbs;
        trail = breadcrumbs;
    } else if (onDashboard) {
        lastTrail.current = [];
        trail = [];
    } else {
        trail = lastTrail.current;
    }

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

    const locations = trail.map<BreadcrumbsItem>((item, index) => {
        const isCurrent = index === trail.length - 1;
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
