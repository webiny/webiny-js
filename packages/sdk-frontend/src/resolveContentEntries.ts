import type { Document } from "@webiny/website-builder-sdk";
import {
    contentEntryCache,
    resolveContentEntryValue,
    isAlreadyResolved
} from "@webiny/website-builder-sdk";
import { contentSdk } from "@webiny/cms-sdk";

/**
 * Register the CMS data loader on the SDK-level content-entry cache.
 *
 * Called by `resolveContentEntries` (server pre-pass) AND by `FrontendSdk.init()`
 * (client bootstrap) so the `BindingsResolver` can resolve content-entry
 * inputs in both environments.
 */
export const ensureContentEntryLoader = () => {
    if (!contentEntryCache.getLoader()) {
        contentEntryCache.setLoader({
            getEntry: params => contentSdk.getEntry(params),
            listEntries: params => contentSdk.listEntries(params)
        });
    }
};

/**
 * Server-side (RSC) pre-pass: resolves every `contentEntry` input into CMS
 * entries and seeds the SDK-level `contentEntryCache`.
 *
 * Content-entry inputs are identified by the `type` field on each
 * `InputValueBinding` — no component manifests or metadata required.
 */
export async function resolveContentEntries(document: Document | null): Promise<void> {
    if (!document) {
        return;
    }

    ensureContentEntryLoader();
    const loader = contentEntryCache.getLoader()!;

    // Collect resolved entries so they can be embedded on the document and
    // travel through React serialisation from server to client.
    const resolved: Record<string, unknown> = {};
    const tasks: Promise<void>[] = [];

    for (const [elementId] of Object.entries(document.elements)) {
        const elementBindings = document.bindings[elementId] ?? {};
        const inputBindings = elementBindings.inputs;

        if (!inputBindings) {
            continue;
        }

        for (const [inputName, binding] of Object.entries(inputBindings)) {
            if (!binding || binding.type !== "contentEntry") {
                continue;
            }

            const rawValue = binding.static;
            const list = binding.list ?? false;
            const cacheKey = `${elementId}:${inputName}`;

            // Already-resolved entries (e.g. editor stored the full entry, not
            // a bare reference) are passed through directly.
            if (isAlreadyResolved(rawValue, list)) {
                contentEntryCache.set(cacheKey, rawValue);
                resolved[cacheKey] = rawValue;
                continue;
            }

            tasks.push(
                resolveContentEntryValue(rawValue, list, loader).then(result => {
                    contentEntryCache.set(cacheKey, result);
                    resolved[cacheKey] = result;
                })
            );
        }
    }

    await Promise.all(tasks);

    // Embed resolved entries on the document cache so the client
    // `BindingsResolver` can hydrate from them (the module-level
    // `contentEntryCache` singleton does not cross the server→client boundary).
    if (Object.keys(resolved).length > 0) {
        if (!document.__cache) {
            document.__cache = {};
        }
        document.__cache.contentEntries = resolved;
    }
}
