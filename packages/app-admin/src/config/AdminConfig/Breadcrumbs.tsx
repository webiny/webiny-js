import React from "react";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";
import type { Route } from "@webiny/app/features/router/Route.js";

/**
 * Where a breadcrumb navigates: either a raw path string, or a `Route` (optionally with
 * params) that the header resolves to a link via the router's `getLink`.
 */
export type BreadcrumbLink = string | { route: Route<any>; params?: Record<string, any> };

export interface BreadcrumbConfig {
    name: string;
    label: string;
    to?: BreadcrumbLink;
    icon?: React.ReactNode;
}

export interface BreadcrumbProps {
    /** Stable id for ordering/diffing. Defaults to `label`. */
    name?: string;
    /** Text label shown for this location. */
    label: string;
    /** Where this item navigates — a path string or a `Route` (+ params). */
    to?: BreadcrumbLink;
    /** Optional leading icon. */
    icon?: React.ReactNode;
    /** Place this item before another (by name). */
    before?: string;
    /** Place this item after another (by name). */
    after?: string;
}

/**
 * Declares a single breadcrumb. Drop it anywhere in a view or sub-view — the header renders
 * every mounted `<Breadcrumb>` as the trail, in mount order, and clears each when it
 * unmounts. Breadcrumbs are pure presentation, so this composes through the React Config API
 * (like `AdminConfig.Menu` / `Dashboard.Widget`) rather than dependency injection.
 *
 * ```tsx
 * <Breadcrumb label="File Manager" to={{ route: Routes.List }} />
 * <Breadcrumb label={folder.title} to={{ route: Routes.List, params: { folderId } }} />
 * ```
 */
export const Breadcrumb = ({ name, label, to, icon, before, after }: BreadcrumbProps) => {
    const getId = useIdGenerator("Breadcrumb");
    const id = name ?? label;

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property
                id={getId(id)}
                name={"breadcrumbs"}
                array={true}
                before={before}
                after={after}
                value={{ name: id, label, to, icon }}
            />
        </ConnectToProperties>
    );
};
