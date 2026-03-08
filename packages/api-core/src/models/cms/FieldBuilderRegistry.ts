import { z } from "zod";
import { createImplementation } from "@webiny/di";
import { TextFieldBuilder, ObjectFieldBuilder, type FieldBuilder } from "./FieldBuilder.js";
import {
    FieldBuilderRegistry as RegistryAbstraction,
    type IFieldBuilderRegistry
} from "./abstractions.js";

class FieldBuilderRegistryImpl implements IFieldBuilderRegistry {
    text(): TextFieldBuilder<z.ZodString> {
        return new TextFieldBuilder();
    }

    object<TShape extends Record<string, z.ZodTypeAny>>(
        fields: (registry: IFieldBuilderRegistry) => {
            [K in keyof TShape]: FieldBuilder<TShape[K]>;
        }
    ): ObjectFieldBuilder<TShape> {
        return new ObjectFieldBuilder(fields, this);
    }
}

export const FieldBuilderRegistry = createImplementation({
    abstraction: RegistryAbstraction,
    implementation: FieldBuilderRegistryImpl,
    dependencies: []
});
