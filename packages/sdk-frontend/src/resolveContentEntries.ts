import type {
    ContentEntryInput,
    ContentEntryInputMeta,
    Document
} from "@webiny/website-builder-sdk";
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
 * Metadata key pattern used by `InputMetadata` to store content-entry config.
 * The editor stores config under an opaque key segment (the binding value's
 * `id`), so we can't derive the input name from the key alone.
 *
 * New configs carry an explicit `inputName` field. For backward compatibility
 * with documents saved before that field was added, we fall back to
 * reverse-mapping the opaque key segment via the flat input bindings.
 */
const METADATA_KEY_PATTERN = /^inputs\/([^/]+)\/config$/;

/**
 * Extract content-entry input configs from element bindings metadata.
 * Returns a map of **input name** → config.
 */
function extractContentEntryConfigs(
    metadata: Record<string, any> | undefined,
    inputBindings: Record<string, any> | undefined
): Map<string, ContentEntryInputMeta> {
    const configs = new Map<string, ContentEntryInputMeta>();
    if (!metadata) {
        return configs;
    }

    // Reverse map for backward compatibility: find which input name has a
    // binding whose resolved value's `id` (or whose own `id`) matches the
    // opaque key segment stored in metadata.
    const idToInputName = new Map<string, string>();
    if (inputBindings) {
        for (const [inputName, binding] of Object.entries(inputBindings)) {
            if (binding && typeof binding === "object") {
                // The binding's own `id` field (the binding identifier).
                if ("id" in binding) {
                    idToInputName.set(binding.id, inputName);
                }
                // The resolved static value's `id` (e.g. a CMS entry ID) —
                // this is what `useInputValue` passes to `InputMetadata`.
                if (
                    binding.static &&
                    typeof binding.static === "object" &&
                    "id" in binding.static
                ) {
                    idToInputName.set(binding.static.id, inputName);
                }
            }
        }
    }

    for (const [key, value] of Object.entries(metadata)) {
        const match = key.match(METADATA_KEY_PATTERN);
        if (match && value && typeof value === "object") {
            const keySegment = match[1];
            // Prefer explicit inputName (new format).
            const inputName = value.inputName ?? idToInputName.get(keySegment) ?? keySegment;
            configs.set(inputName, value as ContentEntryInputMeta);
        }
    }

    return configs;
}

/**
 * Build a synthetic `ContentEntryInput` from metadata config and input name.
 */
function metaToInput(name: string, meta: ContentEntryInputMeta): ContentEntryInput {
    return {
        type: "contentEntry" as const,
        name,
        models: meta.models,
        mode: meta.mode,
        list: meta.list,
        ...(meta.query ? { query: meta.query } : {})
    };
}

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
 * Server-side (RSC) pre-pass: resolves every `contentEntry` input into CMS
 * entries and seeds the SDK-level `contentEntryCache`. The synchronous render
 * loop in `BindingsResolver` reads from the cache — no React context or
 * props needed.
 *
 * Content-entry input configs are read from element bindings **metadata**
 * (written by the editor's `ContentEntryInputRenderer` on mount), so
 * component manifests are not required.
 *
 * Note: elements repeated in a loop share one key per input, so a
 * `contentEntry` input inside a repeated element is not yet disambiguated
 * per instance.
 */
export async function resolveContentEntries(document: Document | null): Promise<void> {
    if (!document) {
        return;
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
        const elementBindings = document.bindings[elementId] ?? {};

        const configs = extractContentEntryConfigs(
            elementBindings.metadata,
            elementBindings.inputs
        );

        if (configs.size === 0) {
            continue;
        }

        // Build a minimal AST from the metadata configs so BindingsResolver
        // can extract raw values from document state for these inputs.
        const syntheticInputs: ContentEntryInput[] = [];
        for (const [inputName, meta] of configs) {
            syntheticInputs.push(metaToInput(inputName, meta));
        }

        const inputAst = ComponentManifestToAstConverter.convert(syntheticInputs);
        const [instance] = new BindingsResolver(document.state).resolveElement({
            element,
            elementBindings,
            inputAst
        });

        for (const [inputName, meta] of configs) {
            const input = metaToInput(inputName, meta);
            const rawValue = instance?.inputs?.[inputName];
            const cacheKey = `${elementId}:${inputName}`;

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

    // Embed resolved entries on the document cache so the client
    // `BindingsResolver` can hydrate from them (the module-level
    // `contentEntryCache` singleton does not cross the server→client
    // boundary).
    if (Object.keys(resolved).length > 0) {
        if (!document.__cache) {
            document.__cache = {};
        }
        document.__cache.contentEntries = resolved;
    }
}
