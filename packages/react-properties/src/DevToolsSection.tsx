import { useEffect } from "react";
import { getHook } from "./useDebugConfig.js";

type DevToolsView = "browse" | "raw";

interface DevToolsSectionProps {
    name: string;
    data: unknown;
    /**
     * Group name for the sidebar. Items with the same group appear
     * under the same header. Defaults to "Sections".
     *
     * @example
     * ```tsx
     * <DevToolsSection name="Article" group="CMS" data={model} />
     * <DevToolsSection name="Author" group="CMS" data={author} />
     * ```
     */
    group?: string;
    /**
     * Which views to show in the detail panel.
     * - `"browse"` — split view with root keys on the left, value tree on the right
     * - `"raw"` — full JSON tree view
     *
     * Accepts a single view or an array. First item is the default tab.
     * @default ["browse", "raw"]
     */
    views?: DevToolsView | DevToolsView[];
}

/**
 * Registers a named section in the Webiny DevTools extension.
 * Renders nothing — purely a data registration side-effect.
 *
 * When the component unmounts (e.g., route change), the section
 * is automatically removed from DevTools.
 *
 * @example
 * ```tsx
 * <DevToolsSection name="CMS Model" data={model} />
 * <DevToolsSection name="Article" group="CMS" data={model} views="raw" />
 * ```
 */
export function DevToolsSection({ name, data, group, views }: DevToolsSectionProps) {
    // Snapshot the data on every render to get a stable, plain value.
    // This also ensures that if data is a MobX observable, we capture
    // the current state as a plain object (no proxies on the hook).
    const dataKey = safeStringify(data);

    useEffect(() => {
        if (process.env.NODE_ENV !== "development") {
            return;
        }

        const normalizedViews: DevToolsView[] = views
            ? Array.isArray(views)
                ? views
                : [views]
            : ["browse", "raw"];

        let plainData: unknown;
        try {
            plainData = JSON.parse(dataKey);
        } catch {
            plainData = data;
        }

        const hook = getHook();
        hook.sections[name] = {
            data: plainData,
            group: group || "Sections",
            views: normalizedViews,
            updatedAt: Date.now()
        };
        hook.revision++;

        return () => {
            if (window.__WEBINY_DEVTOOLS_HOOK__) {
                delete window.__WEBINY_DEVTOOLS_HOOK__.sections[name];
                window.__WEBINY_DEVTOOLS_HOOK__.revision++;
            }
        };
    }, [name, dataKey, group, Array.isArray(views) ? views.join(",") : views]);

    return null;
}

function safeStringify(value: unknown): string {
    try {
        return JSON.stringify(value, (_key, v) => {
            if (typeof v === "function") {
                return `[Function: ${v.name || "anonymous"}]`;
            }
            if (typeof v === "undefined") {
                return "[undefined]";
            }
            return v;
        });
    } catch {
        return String(value);
    }
}
