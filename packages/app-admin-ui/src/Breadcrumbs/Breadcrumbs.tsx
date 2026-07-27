import React, { useCallback, useMemo } from "react";
import { BreadcrumbsFeature, createReactiveComponent } from "@webiny/app-admin";
import type { BreadcrumbLink } from "@webiny/app-admin";
import { useContainer, useFeature } from "@webiny/app";
import { RouterGateway, RouterPresenter } from "@webiny/app/features/router/abstractions.js";
import {
    Breadcrumbs as BreadcrumbsUI,
    type BreadcrumbsItem,
    createHomeBreadcrumbItem
} from "@webiny/admin-ui";

const HOME_PATH = "/";

const BreadcrumbsBase = () => {
    const { presenter } = useFeature(BreadcrumbsFeature);
    const container = useContainer();
    const { vm } = presenter;

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

    const items = useMemo<BreadcrumbsItem[]>(() => {
        const trail = vm.items;

        // Leading home entry always navigates back to the dashboard.
        const home = createHomeBreadcrumbItem(() => navigateTo(HOME_PATH));

        const locations = trail.map<BreadcrumbsItem>((item, index) => {
            const isCurrent = index === trail.length - 1;
            const to = item.to;
            return {
                label: item.label,
                icon: item.icon,
                title: item.title ?? item.label,
                current: isCurrent,
                onClick: !isCurrent && to ? () => navigateTo(to) : undefined
            };
        });

        return [home, ...locations];
    }, [vm.items, navigateTo]);

    return <BreadcrumbsUI items={items} />;
};

export const Breadcrumbs = createReactiveComponent(BreadcrumbsBase);
