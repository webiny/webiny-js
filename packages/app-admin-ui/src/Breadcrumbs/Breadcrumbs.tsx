import React, { useCallback, useRef } from "react";
import { useAdminConfig, createReactiveComponent } from "@webiny/app-admin";
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
 * design-system primitive.
 *
 * Wrapped in `createReactiveComponent` so it re-renders on route changes too (it reads the
 * router's current route) — config changes alone don't fire on every navigation.
 */
const BreadcrumbsBase = () => {
    const { breadcrumbs } = useAdminConfig();
    const container = useContainer();

    // Reading `currentRoute` inside the reactive component subscribes to route changes, so the
    // header updates on every navigation — and lets us detect the (breadcrumb-less) dashboard.
    const currentRoute = container.resolve(RouterPresenter).vm.currentRoute;
    const routeName = currentRoute?.name;
    const onDashboard = currentRoute?.path === HOME_PATH;

    // Keep the previous trail visible while a newly-entered view loads its own (dynamic views
    // mount their breadcrumbs only after their data resolves, which would otherwise flash an
    // empty trail). Cleared on the dashboard, which is legitimately breadcrumb-less.
    const lastTrail = useRef<{ routeName?: string; items: BreadcrumbConfig[] }>({ items: [] });

    let trail: BreadcrumbConfig[];
    if (breadcrumbs.length > 0) {
        lastTrail.current = { routeName, items: breadcrumbs };
        trail = breadcrumbs;
    } else if (onDashboard) {
        lastTrail.current = { routeName, items: [] };
        trail = [];
    } else {
        // Empty trail on a non-dashboard route = the view is still loading its breadcrumbs;
        // hold the last known trail until they arrive.
        trail = lastTrail.current.items;
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

    // Leading home entry (icon) always navigates back to the dashboard.
    const home = createHomeBreadcrumbItem(() => navigateTo(HOME_PATH));

    // No trail (e.g. the dashboard) → show "🏠 › Home" rather than a lone, orphaned home icon
    // (or an empty bar after clicking home), keeping the same shape as trail pages.
    if (trail.length === 0) {
        return <BreadcrumbsUI items={[home, { label: "Home", current: true }]} />;
    }

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

export const Breadcrumbs = createReactiveComponent(BreadcrumbsBase);
