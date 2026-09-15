import type { ComponentManifest, ContentEntryInput, Document } from "@webiny/website-builder-sdk";
import {
    BindingsResolver,
    ComponentManifestToAstConverter,
    contentEntryCache,
    resolveContentEntryInput
} from "@webiny/website-builder-sdk";
import { contentSdk } from "@webiny/cms-sdk";

const ensureLoader = () => {
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
    ensureLoader();
    const loader = contentEntryCache.getLoader()!;

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
            tasks.push(
                resolveContentEntryInput(input, rawValue, loader).then(resolved => {
                    contentEntryCache.set(`${elementId}:${input.name}`, resolved);
                })
            );
        }
    }

    await Promise.all(tasks);
}
