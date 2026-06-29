import { RegisterExtensionPlugin } from "@webiny/handler";
import type { Container } from "@webiny/di";

/**
 * Apply legacy RegisterExtensionPlugins (e.g. the storage-operations presets returned by
 * getStorageOps(...).plugins) against the request container — the test-time equivalent of how the
 * app registers them.
 */
export function processLegacyPlugins(container: Container, plugins: any[]): void {
    const flat = [plugins].flat(Infinity as 1);
    for (const plugin of flat) {
        if (plugin instanceof RegisterExtensionPlugin) {
            plugin.apply({ container } as any);
        }
    }
}
