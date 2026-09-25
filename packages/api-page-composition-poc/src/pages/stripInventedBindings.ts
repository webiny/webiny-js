import { isCredibleDestination, isPlaceholderDestination } from "~/pages/isCredibleDestination.js";
import { isDestinationPath } from "~/pages/rewriteDestinations.js";
import type { PlacedInvention } from "~/pages/recoverInventedDestinations.js";

/** What each element's bindings are judged against: what its own section actually had. */
export interface ElementContext {
    /** The destinations the section carried. */
    captured: ReadonlySet<string>;
    /** The image sources the section carried, for the same judgement applied to pictures. */
    capturedImages?: ReadonlySet<string>;
}

export interface BindingStripResult {
    bindings: Record<string, any>;
    invented: PlacedInvention[];
    /** Images the model invented, emptied rather than rendered. */
    inventedImages: PlacedInvention[];
}

/**
 * The url a file-typed binding carries, whichever shape it is in. A component reads either the object
 * or the bare string (see `fileInputShape`), so both are recognised here — checking only one shape
 * would let that shape's inventions through.
 */
const fileBindingUrl = (value: unknown): string | null => {
    if (typeof value === "string") {
        return value.trim() ? value : null;
    }
    if (value && typeof value === "object") {
        const record = value as { url?: unknown; src?: unknown };
        const url = record.url ?? record.src;
        return typeof url === "string" && url.trim() ? url : null;
    }
    return null;
};

/**
 * Remove destinations the model invented, from the finished page rather than from the inputs.
 *
 * This ran on the inputs first, and missed. An input the composition never derived and that carries
 * no entry in the manifest's `defaults.inputs` is simply absent from the object being checked —
 * `ElementFactory` then fills it from the input's own `params.defaultValue` while building the
 * element, which is after the check. Nine invented `/privacy-policy` links reached a footer that way.
 *
 * Whether a default lands in `defaults.inputs` or in a field's `params.defaultValue` is a choice the
 * model makes per generation, and both are valid. That is the general point: a check placed on an
 * intermediate only covers the shapes that intermediate happens to carry, and downstream of a
 * model-backed stage the shape varies between runs of the same prompt. Checking the bindings checks
 * what the page will actually serve, whichever route the value took to get there.
 *
 * Destination paths are recognised with the same predicate the rewriting pass uses, so the two cannot
 * disagree about what counts as a destination.
 */
export const stripInventedBindings = (params: {
    bindings: Record<string, any>;
    /** Per element, the hrefs captured from the section it was built from. */
    contextByElement: ReadonlyMap<string, ElementContext>;
    sourceHost: string;
}): BindingStripResult => {
    const { bindings, contextByElement, sourceHost } = params;
    const invented: PlacedInvention[] = [];
    const inventedImages: PlacedInvention[] = [];
    const next: Record<string, any> = {};

    for (const [elementId, element] of Object.entries(bindings)) {
        const inputs = (element as { inputs?: Record<string, any> })?.inputs;
        const context = contextByElement.get(elementId);
        if (!inputs || !context) {
            next[elementId] = element;
            continue;
        }

        const nextInputs: Record<string, any> = {};
        for (const [path, binding] of Object.entries(inputs)) {
            const value = (binding as { static?: unknown })?.static;

            /*
             * An image the section never showed is an invention, and it gets the judgement a
             * destination gets. It is emptied, never substituted: an empty slot is honest, and a
             * photograph of a different building is the first thing a customer would notice.
             *
             * Judged on the binding rather than on the inputs, for the reason the destination strip
             * already is — an input the composition never derived is filled from the input's own
             * `params.defaultValue` while the element is built, which is after any check on inputs.
             */
            if ((binding as { type?: unknown })?.type === "file") {
                const url = fileBindingUrl(value);
                const observed = context.capturedImages;
                if (url && observed && !observed.has(url)) {
                    inventedImages.push({ elementId, path, value: url });
                    nextInputs[path] = { ...(binding as object), static: null };
                    continue;
                }
                nextInputs[path] = binding;
                continue;
            }

            if (!isDestinationPath(path) || typeof value !== "string" || !value.trim()) {
                nextInputs[path] = binding;
                continue;
            }
            if (isCredibleDestination(value, { captured: context.captured, sourceHost })) {
                nextInputs[path] = binding;
                continue;
            }

            /*
             * Emptied either way, but only an invented path is recorded: `#` and `/` go nowhere
             * openly and mislead nobody, while `/privacy-policy` looks live and 404s.
             */
            if (!isPlaceholderDestination(value)) {
                invented.push({ elementId, path, value: value.trim() });
            }
            nextInputs[path] = { ...(binding as object), static: "" };
        }

        next[elementId] = { ...(element as object), inputs: nextInputs };
    }

    return { bindings: next, invented, inventedImages };
};
