import type { Container } from "@webiny/di";

const REGISTER_EXTENSION_TYPE = "handler.register.extension";

/**
 * Apply legacy RegisterExtensionPlugins (e.g. the storage-operations presets returned by
 * getStorageOps(...).plugins) against the request container — the test-time equivalent of how the
 * app registers them.
 *
 * Detection is by `plugin.type` rather than `instanceof RegisterExtensionPlugin`: a consumer's
 * dependency tree can resolve a second copy of `@webiny/handler`, giving the storage-preset plugins
 * a different class identity than the one this (shipped) module imports, which would make an
 * `instanceof` check silently miss them.
 */
export function processLegacyPlugins(container: Container, plugins: any[]): void {
    const flat = [plugins].flat(Infinity as 1);
    for (const plugin of flat) {
        if (
            plugin &&
            plugin.type === REGISTER_EXTENSION_TYPE &&
            typeof plugin.apply === "function"
        ) {
            plugin.apply({ container } as any);
        }
    }
}
