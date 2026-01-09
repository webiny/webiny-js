import { type DefineExtensionParams, type ParamsSchemaDefinition } from "~/defineExtension/types.js";
import { createExtensionDefinition } from "./createExtensionDefinition.js";
import { createExtensionReactComponent } from "./createExtensionReactComponent.js";

export type ExtensionComponent<TParamsSchema extends ParamsSchemaDefinition | undefined> = ReturnType<
    typeof createExtensionReactComponent<TParamsSchema>
> & {
    def: ReturnType<typeof createExtensionDefinition<TParamsSchema>>;
    getDefinition: () => ReturnType<typeof createExtensionDefinition<TParamsSchema>>;
};

export function defineExtension<TParamsSchema extends ParamsSchemaDefinition | undefined>(
    extensionParams: DefineExtensionParams<TParamsSchema>
) {
    const definition = createExtensionDefinition<TParamsSchema>(extensionParams);
    const ReactComponent = createExtensionReactComponent<TParamsSchema>(extensionParams);

    // Attach properties to the React component
    const component = ReactComponent as ExtensionComponent<TParamsSchema>;
    component.def = definition;
    component.getDefinition = () => definition;

    return component;
}
