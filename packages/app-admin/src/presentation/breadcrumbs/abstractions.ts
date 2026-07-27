import type React from "react";
import { Abstraction } from "@webiny/di";
import { createAbstraction } from "@webiny/feature/admin";
import type { Route } from "@webiny/app/features/router/Route.js";
import type { MatchedRoute } from "@webiny/app/features/router/abstractions.js";

/**
 * Where a breadcrumb navigates: either a raw path string, or a `Route` (optionally with
 * params) that the header resolves to a link via the router's `getLink`.
 */
export type BreadcrumbLink = string | { route: Route<any>; params?: Record<string, any> };

/**
 * A single location in a breadcrumb trail. The trail describes the location items only —
 * the leading "home" entry is rendered by the UI and always points at the dashboard.
 */
export interface BreadcrumbTrailItem {
    /**
     * Stable identifier, used as the React key and for ordering/diffing. Defaults to `label`.
     */
    id?: string;
    /** Text label shown for this location. */
    label: string;
    /** Optional leading icon for this location. */
    icon?: React.ReactNode;
    /**
     * Where this item navigates when activated — a path string or a `Route` (+ params). The
     * last (current) item is rendered non-interactively regardless of `to`.
     */
    to?: BreadcrumbLink;
    /** Full, untruncated text used as the native tooltip. Defaults to `label`. */
    title?: string;
}

export interface BreadcrumbsViewModel {
    /** Location items, from the top-most ancestor to the current page (last item). */
    items: BreadcrumbTrailItem[];
}

/**
 * A breadcrumb trail declared for a route via dependency injection — no React involved.
 * Register one with `Breadcrumb.createImplementation(...)`; the presenter resolves all of
 * them and renders the trail whose `route` matches the current location.
 *
 * This is the preferred way to declare a **static** trail (just links and text). For trails
 * that depend on live view state (a folder path, an entry's title), use the `useBreadcrumbs`
 * hook instead.
 */
export interface IBreadcrumb {
    /** Unique id. */
    name: string;
    /** The route this breadcrumb trail belongs to; matched against the current route. */
    route: Route<any>;
    /** Builds the trail. Receives the matched route so params are available if needed. */
    getTrail(route: MatchedRoute): BreadcrumbTrailItem[];
}

export const Breadcrumb = createAbstraction<IBreadcrumb>("Breadcrumb");

export namespace Breadcrumb {
    export type Interface = IBreadcrumb;
}

export interface IBreadcrumbsPresenter {
    vm: BreadcrumbsViewModel;
    /** Replaces the current trail. Views call this to declare their location. */
    setTrail(items: BreadcrumbTrailItem[]): void;
    /** Clears the trail (e.g. when a view unmounts). */
    clear(): void;
}

export const BreadcrumbsPresenter = new Abstraction<IBreadcrumbsPresenter>("BreadcrumbsPresenter");

export namespace BreadcrumbsPresenter {
    export type Interface = IBreadcrumbsPresenter;
    export type ViewModel = BreadcrumbsViewModel;
}
