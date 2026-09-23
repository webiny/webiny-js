import { isCredibleDestination, isPlaceholderDestination } from "~/pages/isCredibleDestination.js";
import { isDestinationPath } from "~/pages/rewriteDestinations.js";
import type { PlacedInvention } from "~/pages/recoverInventedDestinations.js";

/** What each element's destinations are judged against: the links its own section actually had. */
export interface ElementContext {
    captured: ReadonlySet<string>;
}

export interface BindingStripResult {
    bindings: Record<string, any>;
    invented: PlacedInvention[];
}

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

    return { bindings: next, invented };
};
