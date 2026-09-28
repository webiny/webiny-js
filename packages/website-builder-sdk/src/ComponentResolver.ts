import type { ComponentRegistry } from "~/ComponentRegistry.js";
import type {
    DocumentElement,
    DocumentElementBindings,
    DocumentState,
    ResolvedComponent
} from "~/types.js";
import { logger } from "./Logger.js";
import type { OnResolved } from "./BindingsResolver.js";
import { BindingsResolver } from "./BindingsResolver.js";
import { ComponentManifestToAstConverter } from "~/ComponentManifestToAstConverter.js";

export type ResolveElementParams = {
    element: DocumentElement;
    elementBindings: DocumentElementBindings;
    state: DocumentState;
    onResolved?: OnResolved;
};

export class ComponentResolver {
    private components: ComponentRegistry;

    constructor(registry: ComponentRegistry) {
        this.components = registry;
    }

    resolve({
        element,
        elementBindings = {},
        onResolved,
        state
    }: ResolveElementParams): ResolvedComponent[] | null {
        const componentName = element.component.name;
        const blueprint = this.components.get(componentName);

        if (!blueprint) {
            /*
             * What was wanted AND what is available. A bare "unknown" cannot distinguish an empty
             * registry from a name mismatch, and a name mismatch is what made every component on
             * every migrated page unresolvable while each stage reported success: pages referenced
             * "Site/FAQ Section" and the bundles registered "Custom/FaqSection". The near-miss is
             * usually the whole diagnosis, so it is offered rather than left to be discovered.
             */
            const available = this.components.names();
            logger.warn(
                available.length === 0
                    ? `Unknown component: ${componentName} — no components are registered at all.`
                    : `Unknown component: ${componentName} — ${available.length} registered${describeNearest(componentName, available)}`
            );
            return null;
        }

        const bindingsResolver = new BindingsResolver(state);
        const instances = bindingsResolver.resolveElement({
            element,
            elementBindings,
            inputAst: ComponentManifestToAstConverter.convert(blueprint.manifest.inputs ?? []),
            onResolved
        });

        return instances.map(instance => ({
            component: blueprint.component,
            manifest: blueprint.manifest!,
            styles: instance.styles,
            inputs: instance.inputs
        }));
    }
}

/**
 * The registered names closest to the one that was wanted, as a suffix for the warning.
 *
 * Matched on the last path segment, because the mismatch that prompted this was a namespace one:
 * "2424Tulane/FAQ Section" against "Custom/FaqSection" share nothing but their tail, and the tail is
 * what makes the relationship obvious on sight.
 */
const describeNearest = (wanted: string, available: string[]): string => {
    const tail = (name: string) =>
        name
            .split("/")
            .pop()
            ?.toLowerCase()
            .replace(/[^a-z0-9]/g, "") ?? "";
    const wantedTail = tail(wanted);

    const near = available
        .filter(name => {
            const candidate = tail(name);
            return (
                candidate.length > 0 &&
                (candidate === wantedTail ||
                    candidate.includes(wantedTail) ||
                    wantedTail.includes(candidate))
            );
        })
        .slice(0, 3);

    if (near.length === 0) {
        return `, none matching. Registered: ${available.slice(0, 3).join(", ")}${available.length > 3 ? ", …" : ""}`;
    }
    return `, did you mean ${near.map(name => `"${name}"`).join(" or ")}?`;
};
