import { useEffect } from "react";
import { getHook } from "./useDebugConfig.js";

interface DevToolsSectionProps {
    name: string;
    data: unknown;
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
 * ```
 */
export function DevToolsSection({ name, data }: DevToolsSectionProps) {
    useEffect(() => {
        if (process.env.NODE_ENV !== "development") {
            return;
        }

        const hook = getHook();
        hook.sections[name] = {
            data,
            updatedAt: Date.now()
        };
        hook.revision++;

        return () => {
            if (window.__WEBINY_DEVTOOLS_HOOK__) {
                delete window.__WEBINY_DEVTOOLS_HOOK__.sections[name];
                window.__WEBINY_DEVTOOLS_HOOK__.revision++;
            }
        };
    }, [name, data]);

    return null;
}
