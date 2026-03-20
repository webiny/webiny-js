import { useEffect } from "react";
import type { Property } from "./Properties.js";
import { toObject } from "./utils.js";

interface WebinyDevtoolsConfig {
    properties: Array<{
        id: string;
        parent: string;
        name: string;
        value?: unknown;
        array?: boolean;
    }>;
    config: unknown;
    updatedAt: number;
}

interface WebinyDevtoolsSection {
    data: unknown;
    group: string;
    views: string[];
    updatedAt: number;
}

interface WebinyDevtoolsHook {
    revision: number;
    configs: Record<string, WebinyDevtoolsConfig>;
    sections: Record<string, WebinyDevtoolsSection>;
}

declare global {
    interface Window {
        __debugConfigs: Record<string, () => void>;
        __WEBINY_DEVTOOLS_HOOK__?: WebinyDevtoolsHook;
    }
}

export function getHook(): WebinyDevtoolsHook {
    if (!window.__WEBINY_DEVTOOLS_HOOK__) {
        window.__WEBINY_DEVTOOLS_HOOK__ = { revision: 0, configs: {}, sections: {} };
    }
    return window.__WEBINY_DEVTOOLS_HOOK__;
}

export function useDebugConfig(name: string, properties: Property[]) {
    useEffect(() => {
        if (process.env.NODE_ENV !== "development") {
            return;
        }

        // Legacy console.log support
        const configs = window.__debugConfigs ?? {};
        configs[name] = () => console.log(toObject(properties));
        window.__debugConfigs = configs;

        // DevTools hook: structured data for the Chrome extension
        const hook = getHook();
        hook.configs[name] = {
            properties: properties.map(p => ({
                id: p.id,
                parent: p.parent,
                name: p.name,
                value: p.value,
                array: p.array
            })),
            config: toObject(properties),
            updatedAt: Date.now()
        };
        hook.revision++;

        return () => {
            // Legacy cleanup
            const configs = window.__debugConfigs ?? {};
            delete configs[name];
            window.__debugConfigs = configs;

            // DevTools hook cleanup
            if (window.__WEBINY_DEVTOOLS_HOOK__) {
                delete window.__WEBINY_DEVTOOLS_HOOK__.configs[name];
                window.__WEBINY_DEVTOOLS_HOOK__.revision++;
            }
        };
    }, [properties]);
}
