import { RegisterExtensionPlugin } from "@webiny/handler";
import type { Container } from "@webiny/di";

export function processLegacyPlugins(container: Container, plugins: any[]): void {
    const flat = [plugins].flat(Infinity as 1);
    for (const plugin of flat) {
        if (plugin instanceof RegisterExtensionPlugin) {
            plugin.apply({ container } as any);
        }
    }
}
