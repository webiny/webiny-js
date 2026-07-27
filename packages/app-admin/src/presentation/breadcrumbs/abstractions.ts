import type React from "react";
import { Abstraction } from "@webiny/di";
import type { Route } from "@webiny/app/features/router/Route.js";

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
