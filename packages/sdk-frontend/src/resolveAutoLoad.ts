import type { ComponentManifest, ContentEntryInput, Document } from "@webiny/website-builder-sdk";
import {
    BindingsResolver,
    ComponentManifestToAstConverter,
    contentEntryCache,
    resolveContentEntryInput
} from "@webiny/website-builder-sdk";
import { contentSdk } from "@webiny/cms-sdk";

/**
 * Register the CMS data loader on the SDK-level content-entry cache.
 *
 * Called by `resolveAutoLoad` (server pre-pass) AND by `FrontendSdk.init()`
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
 * The framework reads only a component's manifest, so callers may pass either
 * full component blueprints or plain `{ manifest }` carriers. A server module
 * should expose the latter, since component modules are `"use client"` (their
 * exports become client references and can't be read on the server).
 */
export type ManifestCarrier = { manifest: Pick<ComponentManifest, "name" | "inputs"> };

/**
 * Detect whether a content-entry input's raw value (from the document state)
 * is already a resolved CMS entry rather than a bare `{ id, modelId }`
 * reference that needs fetching. The BindingsResolver returns whatever the
 * binding expression evaluates to in the document state — for content-entry
 * inputs the editor stores the full resolved entry, not a reference.
 */
function isAlreadyResolved(input: ContentEntryInput, value: unknown): boolean {
    if (value == null) {
        return false;
    }
    if (input.mode === "query") {
        return typeof value === "object" && "items" in (value as any);
    }
    if (input.list) {
        if (!Array.isArray(value) || value.length === 0) {
            return false;
        }
        const first = value[0];
        return typeof first === "object" && first !== null && "values" in first;
    }
    return (
        typeof value === "object" && "values" in (value as any) && !("modelId" in (value as any))
    );
}

/**
 * Server-side (RSC) pre-pass: resolves every `contentEntry` input with
 * `autoLoad !== false` into CMS entries and seeds the SDK-level
 * `contentEntryCache`. The synchronous render loop in `BindingsResolver`
 * reads from the cache — no React context or props needed.
 *
 * Call it in the Next.js page after fetching the document, before rendering
 * `<DocumentRenderer>`.
 *
 * Note: elements repeated in a loop share one key per input, so a `contentEntry`
 * input inside a repeated element is not yet disambiguated per instance.
 */
export async function resolveAutoLoad(
    document: Document | null,
    components: ManifestCarrier[]
): Promise<void> {
    if (!document) {
        return;
    }

    // Guard against a non-array (e.g. a `"use client"` module reference passed
    // in from a server component).
    // Only the passed manifests are considered. The framework's own built-in
    // components (Box, Grid, Root, …) are `"use client"` modules — unreadable on
    // the server — and never contain `contentEntry` inputs, so they're excluded.
    const list = Array.isArray(components) ? components : [];
    const manifestMap = new Map<string, Pick<ComponentManifest, "name" | "inputs">>();
    for (const blueprint of list) {
        // Skip anything that isn't a real manifest carrier (e.g. a client-module
        // reference that resolved to a proxy on the server).
        if (!blueprint?.manifest) {
            continue;
        }
        manifestMap.set(blueprint.manifest.name, blueprint.manifest);
    }

    // Register the CMS loader on the SDK-level cache so that
    // `BindingsResolver` can also use it for editor-preview resolution.
    ensureContentEntryLoader();
    const loader = contentEntryCache.getLoader()!;

    // Collect resolved entries so they can be embedded on the document and
    // travel through React serialisation from server to client.
    const resolved: Record<string, unknown> = {};
    const tasks: Promise<void>[] = [];

    for (const [elementId, element] of Object.entries(document.elements)) {
        const manifest = manifestMap.get(element.component.name);
        if (!manifest) {
            continue;
        }

        const contentEntryInputs = (manifest.inputs ?? []).filter(
            (input): input is ContentEntryInput => input.type === "contentEntry"
        );
        if (contentEntryInputs.length === 0) {
            continue;
        }

        const [instance] = new BindingsResolver(document.state).resolveElement({
            element,
            elementBindings: document.bindings[elementId] ?? {},
            inputAst: ComponentManifestToAstConverter.convert(manifest.inputs ?? [])
        });

        for (const input of contentEntryInputs) {
            const rawValue = instance?.inputs?.[input.name];
            const cacheKey = `${elementId}:${input.name}`;

            // The document state stores the full resolved entry (not a bare
            // { id, modelId } reference). Pass it through directly.
            if (isAlreadyResolved(input, rawValue)) {
                contentEntryCache.set(cacheKey, rawValue);
                resolved[cacheKey] = rawValue;
                continue;
            }

            tasks.push(
                resolveContentEntryInput(input, rawValue, loader).then(result => {
                    contentEntryCache.set(cacheKey, result);
                    resolved[cacheKey] = result;
                })
            );
        }
    }

    await Promise.all(tasks);

    // Embed resolved entries on the document state so the client
    // `BindingsResolver` can hydrate from them (the module-level
    // `contentEntryCache` singleton does not cross the server→client
    // boundary). We attach to `state` because that's what
    // `BindingsResolver` receives as `this.state`.
    if (Object.keys(resolved).length > 0) {
        if (!document.state) {
            (document as any).state = {};
        }
        // Strip mobx observables — RSC serialisation rejects objects with
        // symbol properties (mobx administration).
        (document.state as any).__resolvedContentEntries = JSON.parse(JSON.stringify(resolved));
    }
}
