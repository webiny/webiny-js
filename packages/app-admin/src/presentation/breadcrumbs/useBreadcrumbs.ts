import { useEffect, useMemo } from "react";
import { useFeature } from "@webiny/app";
import { BreadcrumbsFeature } from "./feature.js";
import type { BreadcrumbLink, BreadcrumbTrailItem } from "./abstractions.js";

// Stable string form of a link, for change detection. A `Route` is a class instance and
// won't JSON-serialize usefully, so key it by its name plus params.
const linkSignature = (to: BreadcrumbLink | undefined): string => {
    if (!to) {
        return "";
    }
    if (typeof to === "string") {
        return to;
    }
    return `${to.route.name}:${JSON.stringify(to.params ?? {})}`;
};

/**
 * Declares the breadcrumb trail for the current view. Call it with the location items
 * (top-most ancestor first, current page last); the header renders them after the home
 * entry. The trail is set on mount and whenever the items change, and cleared on unmount.
 *
 * Icons are ignored when computing change detection, so passing an inline array is safe.
 */
export function useBreadcrumbs(items: BreadcrumbTrailItem[]): void {
    const { presenter } = useFeature(BreadcrumbsFeature);

    // A stable signature so an inline `items` array doesn't re-fire the effect every render.
    // React nodes (icons) can't be serialized, so they're intentionally excluded here.
    const signature = useMemo(
        () =>
            items.map(item => [
                item.id ?? item.label,
                item.label,
                linkSignature(item.to),
                item.title
            ]),
        [items]
    );
    const key = JSON.stringify(signature);

    useEffect(() => {
        presenter.setTrail(items);
        return () => presenter.clear();
        // `key` captures every serializable change to `items`; `items` itself is intentionally
        // excluded so a new array with identical content doesn't reset the trail.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [presenter, key]);
}
