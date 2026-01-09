// @ts-nocheck This class operates via a Proxy, so it's difficult to type check.
import camelCase from "lodash/camelCase.js";
import {
    FieldBuilderRegistry as RegistryAbstraction,
    type IFieldBuilderRegistry
} from "../abstractions.js";
import { FieldType, type IFieldTypeFactory } from "./abstractions.js";

// @ts-expect-error
class FieldBuilderRegistryImpl implements IFieldBuilderRegistry {
    private fieldTypes = new Map<string, IFieldTypeFactory>();

    constructor(fieldTypeFactories: IFieldTypeFactory[]) {
        // Register all field types by their type name
        for (const factory of fieldTypeFactories) {
            this.fieldTypes.set(factory.type, factory);
            // Also register camelCase aliases for hyphenated types
            if (factory.type.includes("-")) {
                this.fieldTypes.set(camelCase(factory.type), factory);
            }
        }

        // Return Proxy for dynamic method access
        return new Proxy(this, {
            get(target, prop: string) {
                // Check if it's a registered field type
                const factory = target.fieldTypes.get(prop);
                if (factory) {
                    return () => factory.create();
                }

                // Otherwise return the actual property
                return (target as any)[prop];
            }
        }) as any;
    }
}

export const FieldBuilderRegistry = RegistryAbstraction.createImplementation({
    implementation: FieldBuilderRegistryImpl,
    dependencies: [[FieldType, { multiple: true }]]
});
