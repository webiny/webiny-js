import type { ComponentManifest, ContentEntryInput, Document } from "@webiny/website-builder-sdk";
import {
    BindingsResolver,
    ComponentManifestToAstConverter,
    resolveContentEntryInput,
    type ContentEntryLoader,
    type ResolvedContentEntry
} from "@webiny/website-builder-sdk";
import { contentSdk } from "@webiny/cms-sdk";
import { editorComponents } from "../editorComponents/index.js";

const loader: ContentEntryLoader = {
    getEntry: params => contentSdk.getEntry(params),
    listEntries: params => contentSdk.listEntries(params)
};

export type ResolvedContentEntries = Record<string, ResolvedContentEntry>;

/**
 * The framework reads only a component's manifest, so callers may pass either
 * full component blueprints or plain `{ manifest }` carriers. A server module
 * should expose the latter, since component modules are `"use client"` (their
 * exports become client references and can't be read on the server).
 */
export type ManifestCarrier = { manifest: Pick<ComponentManifest, "name" | "inputs"> };

/**
 * Server-side (RSC) pre-pass: resolves every `contentEntry` input with
 * `autoLoad !== false` into CMS entries, keyed by `"<elementId>:<inputName>"`.
 *
 * Call it in the Next.js page after fetching the document, then pass the result
 * to `<DocumentRenderer resolvedContentEntries={...}>`. The (synchronous) render
 * loop reads it via `onResolved` — no `useEffect`, SSR-safe — mirroring how the
 * CMS resolves data on the server and hands it to the renderer as props.
 *
 * Note: elements repeated in a loop share one key per input, so a `contentEntry`
 * input inside a repeated element is not yet disambiguated per instance.
 */
export async function resolveAutoLoad(
    document: Document | null,
    components: ManifestCarrier[]
): Promise<ResolvedContentEntries> {
    const result: ResolvedContentEntries = {};
    if (!document) {
        return result;
    }

    // Guard against a non-array (e.g. a `"use client"` module reference passed
    // in from a server component).
    const list = Array.isArray(components) ? components : [];
    const manifestMap = new Map<string, Pick<ComponentManifest, "name" | "inputs">>();
    for (const blueprint of [...editorComponents, ...list]) {
        manifestMap.set(blueprint.manifest.name, blueprint.manifest);
    }

    const tasks: Promise<void>[] = [];

    for (const [elementId, element] of Object.entries(document.elements)) {
        const manifest = manifestMap.get(element.component.name);
        if (!manifest) {
            continue;
        }

        const contentEntryInputs = (manifest.inputs ?? []).filter(
            (input): input is ContentEntryInput =>
                input.type === "contentEntry" && (input as ContentEntryInput).autoLoad !== false
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
                    result[`${elementId}:${input.name}`] = resolved;
                })
            );
        }
    }

    await Promise.all(tasks);
    return result;
}
