import { RegisterExtensionPlugin } from "@webiny/handler";
import type { Container } from "@webiny/di";

/**
 * Processes legacy plugin arrays (from getStorageOps().plugins) and applies any
 * RegisterExtensionPlugin instances to the DI container.
 *
 * This bridges the old ContextPlugin-based plugin system to the new DI world
 * so that storage operations factories registered via legacy plugins are available.
 */
export function processLegacyPlugins(container: Container, plugins: any[]): void {
    const flat = [plugins].flat(Infinity as 1);
    for (const plugin of flat) {
        if (plugin instanceof RegisterExtensionPlugin) {
            plugin.apply({ container } as any);
        }
    }
}
