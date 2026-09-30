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
            logger.warn(`Unknown component: ${componentName}`);
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
