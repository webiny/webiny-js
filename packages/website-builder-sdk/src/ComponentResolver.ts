import type { ComponentRegistry } from "~/ComponentRegistry.js";
import type {
    DocumentCache,
    DocumentElement,
    DocumentElementBindings,
    DocumentState,
    ResolvedComponent
} from "~/types.js";
import { logger } from "./Logger.js";
import type { OnResolved } from "./BindingsResolver.js";
import { BindingsResolver } from "./BindingsResolver.js";
import { ContentEntryBindingsResolver } from "./contentEntry/ContentEntryBindingsResolver.js";
import { ComponentManifestToAstConverter } from "~/ComponentManifestToAstConverter.js";
export type ResolveElementParams = {
    element: DocumentElement;
    elementBindings: DocumentElementBindings;
    state: DocumentState;
    cache?: DocumentCache;
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
        state,
        cache
    }: ResolveElementParams): ResolvedComponent[] | null {
        const componentName = element.component.name;
        const blueprint = this.components.get(componentName);

        if (!blueprint) {
            logger.warn(`Unknown component: ${componentName}`);
            return null;
        }

        // Build the pre-resolved entries map from the document cache
        // (populated by `resolveContentEntries` on the server).
        const embedded = cache?.contentEntries as Record<string, unknown> | undefined;
        const resolvedEntries = embedded ? new Map(Object.entries(embedded)) : undefined;

        const resolver = new ContentEntryBindingsResolver(
            new BindingsResolver(state),
            resolvedEntries
        );

        const instances = resolver.resolveElement({
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
