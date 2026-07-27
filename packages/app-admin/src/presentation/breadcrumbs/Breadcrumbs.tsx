import React from "react";
import { useBreadcrumbs } from "./useBreadcrumbs.js";
import type { BreadcrumbLink, BreadcrumbTrailItem } from "./abstractions.js";

export interface BreadcrumbItemProps {
    /** Stable identifier (defaults to `label`). */
    id?: string;
    /** Text label shown for this location. */
    label: string;
    /**
     * Where this item navigates — a path string or a `Route` (+ params). The current (last)
     * item is never interactive.
     */
    to?: BreadcrumbLink;
    /** Optional leading icon. */
    icon?: React.ReactNode;
    /** Full, untruncated tooltip text (defaults to `label`). */
    title?: string;
}

/**
 * Declarative marker for a single breadcrumb. Renders nothing on its own — `<Breadcrumbs>`
 * reads its props to build the trail.
 */
const BreadcrumbItem = (_props: BreadcrumbItemProps) => null;

export interface BreadcrumbsProps {
    children: React.ReactNode;
}

const isBreadcrumbItem = (
    child: React.ReactNode
): child is React.ReactElement<BreadcrumbItemProps> => {
    return React.isValidElement(child) && child.type === BreadcrumbItem;
};

/**
 * Declarative breadcrumbs config. Place it inside a view and describe the trail with
 * `<Breadcrumbs.Item>` children:
 *
 * ```tsx
 * <Breadcrumbs>
 *   <Breadcrumbs.Item label="Page Builder" to={pbRoute} />
 *   <Breadcrumbs.Item label="Articles" />
 * </Breadcrumbs>
 * ```
 *
 * Built on top of the DI-backed `useBreadcrumbs` hook, which is also usable directly.
 */
const Breadcrumbs = (props: BreadcrumbsProps) => {
    const items: BreadcrumbTrailItem[] = React.Children.toArray(props.children)
        .filter(isBreadcrumbItem)
        .map(child => {
            const { id, label, to, icon, title } = child.props;
            return { id, label, to, icon, title };
        });

    useBreadcrumbs(items);

    return null;
};

Breadcrumbs.Item = BreadcrumbItem;

export { Breadcrumbs };
