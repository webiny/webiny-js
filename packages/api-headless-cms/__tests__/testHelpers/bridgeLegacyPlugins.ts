import { registerExtensions } from "@webiny/handler";
import type { Container } from "@webiny/di";

/**
 * Processes legacy plugin arrays (from getStorageOps().plugins) and applies any
 * RegisterExtensionPlugin instances to the DI container.
 *
 * This bridges the old ContextPlugin-based plugin system to the new DI world
 * so that storage operations factories registered via legacy plugins are available.
 */
export async function processLegacyPlugins(container: Container, plugins: any[]): Promise<void> {
    await registerExtensions(container, plugins);
}
