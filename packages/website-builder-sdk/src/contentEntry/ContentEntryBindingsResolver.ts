import type { ContentEntryInput, ResolvedElement } from "~/types.js";
import type { IBindingsResolver, ResolveElementParams } from "~/BindingsResolver.js";
import type { InputAstNode } from "~/ComponentManifestToAstConverter.js";
import { contentEntryCache } from "./ContentEntryCache.js";
import { environment } from "~/Environment.js";

/**
 * Decorator for `IBindingsResolver` that resolves `contentEntry` inputs.
 *
 * The inner resolver evaluates binding expressions against the document state,
 * producing raw values (`{ id, modelId }` references or query params). This
 * decorator then replaces those raw values with pre-resolved CMS entries from
 * a supplied map, or (on the client) triggers async resolution via the
 * `contentEntryCache` singleton.
 *
 * **Server path**: `resolveContentEntries()` pre-fetches all entries, builds
 * the `resolvedEntries` map, and passes it here. The decorator synchronously
 * swaps raw values for resolved entries during render.
 *
 * **Client path (editor preview)**: `resolvedEntries` may be empty. The
 * decorator falls back to `contentEntryCache.resolve()` which kicks off an
 * async fetch; the mobx-observable cache triggers re-render when it lands.
 */
export class ContentEntryBindingsResolver implements IBindingsResolver {
    constructor(
        private readonly inner: IBindingsResolver,
        private readonly resolvedEntries: ReadonlyMap<string, unknown> = new Map()
    ) {}

    resolveElement(params: ResolveElementParams): ResolvedElement[] {
        const results = this.inner.resolveElement(params);

        for (const instance of results) {
            this.enrichContentEntryInputs(params.element.id, params.inputAst, instance.inputs);
        }

        return results;
    }

    /**
     * Walk the input AST and replace raw content-entry values with resolved
     * entries from the map or the module-level cache.
     */
    private enrichContentEntryInputs(
        elementId: string,
        ast: InputAstNode[],
        inputs: Record<string, any>
    ): void {
        for (const node of ast) {
            if (node.input.type === "contentEntry") {
                const key = `${elementId}:${node.name}`;
                const rawValue = inputs[node.name];

                // 1. Pre-resolved entries map (seeded by server pre-pass).
                if (this.resolvedEntries.has(key)) {
                    inputs[node.name] = this.resolvedEntries.get(key);
                    continue;
                }

                // 2. Module-level cache (populated by previous renders or
                //    async resolves on the client).
                if (contentEntryCache.has(key)) {
                    inputs[node.name] = contentEntryCache.get(key);
                    continue;
                }

                // 3. Client-side async resolution: trigger a background fetch.
                //    The observable cache write will cause a re-render.
                if (environment.isClient() && contentEntryCache.getLoader()) {
                    const cacheKey = `${key}:${JSON.stringify(rawValue ?? null)}`;
                    contentEntryCache.resolve(cacheKey, node.input as ContentEntryInput, rawValue);
                    const cached = contentEntryCache.get(cacheKey);
                    if (cached !== undefined) {
                        inputs[node.name] = cached;
                    }
                }
            }

            // Recurse into children (object / object-list nodes).
            if (node.children.length > 0) {
                const value = inputs[node.name];
                if (node.list && Array.isArray(value)) {
                    for (const item of value) {
                        if (typeof item === "object" && item !== null) {
                            this.enrichContentEntryInputs(elementId, node.children, item);
                        }
                    }
                } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                    this.enrichContentEntryInputs(elementId, node.children, value);
                }
            }
        }
    }
}
