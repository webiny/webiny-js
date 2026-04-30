import {
    FieldBuilderRegistry as Abstraction,
    FieldType,
    type IFieldBuilderRegistry
} from "./abstractions.js";

// @ts-expect-error The interface is augmented dynamically, and TS complains about those dynamic methods.
class FieldBuilderRegistryImpl implements Abstraction.Interface {
    private fieldTypes = new Map<string, FieldType.Interface>();

    constructor(factories: FieldType.Interface[]) {
        for (const factory of factories) {
            this.fieldTypes.set(factory.type, factory);
        }

        const proxy = new Proxy(this, {
            get(target, prop: string) {
                const factory = target.fieldTypes.get(prop);
                if (factory) {
                    return () => factory.create(proxy as unknown as IFieldBuilderRegistry);
                }
                return target[prop as keyof typeof target];
            }
        }) as any;

        return proxy;
    }
}

export const FieldBuilderRegistry = Abstraction.createImplementation({
    // @ts-expect-error
    implementation: FieldBuilderRegistryImpl,
    // @ts-expect-error
    dependencies: [[FieldType, { multiple: true }]]
});
