import { z } from "zod";
import type { FieldBuilder } from "./FieldBuilder.js";
import type { IFieldBuilderRegistry } from "./abstractions.js";
import type { FieldConfig, FieldBuilderConfig } from "./types.js";

export class FieldDefinitionsBuilder<TFields extends z.ZodRawShape = {}> {
    private fields = new Map<string, FieldBuilderConfig>();

    constructor(private registry: IFieldBuilderRegistry) {}

    // Keep the old .field() method for internal use
    field<K extends string, TZod extends z.ZodTypeAny>(
        name: K,
        configure: (field: IFieldBuilderRegistry) => FieldBuilder<TZod>
    ): FieldDefinitionsBuilder<TFields & Record<K, TZod>> {
        const fieldBuilder = configure(this.registry);
        const config = fieldBuilder.toConfig();
        config.fieldId = name;

        this.fields.set(name, {
            fieldId: name,
            config,
            zodSchema: fieldBuilder.getZodSchema()
        });

        return this as any;
    }

    // Internal method to build from object
    __fromObject<TShape extends Record<string, FieldBuilder<any>>>(
        shape: TShape
    ): FieldDefinitionsBuilder<{ [K in keyof TShape]: ReturnType<TShape[K]["getZodSchema"]> }> {
        for (const [fieldId, fieldBuilder] of Object.entries(shape)) {
            const config = fieldBuilder.toConfig();
            config.fieldId = fieldId;

            this.fields.set(fieldId, {
                fieldId,
                config,
                zodSchema: fieldBuilder.getZodSchema()
            });
        }

        return this as any;
    }

    __toZodSchema(): z.ZodObject<TFields> {
        const schemaShape = {} as TFields;

        for (const [fieldId, { zodSchema }] of this.fields) {
            schemaShape[fieldId as keyof TFields] = zodSchema as TFields[keyof TFields];
        }

        return z.object(schemaShape);
    }

    __getFields(): FieldConfig[] {
        return Array.from(this.fields.values()).map(f => f.config);
    }

    __getFieldsMap(): Map<string, FieldBuilderConfig> {
        return new Map(this.fields);
    }
}

// Updated factory function - now takes an object!
export function createFieldDefinitions<TShape extends Record<string, FieldBuilder<any>>>(
    factory: (fields: IFieldBuilderRegistry) => TShape
): FieldDefinitionsFactory<{ [K in keyof TShape]: ReturnType<TShape[K]["getZodSchema"]> }> {
    return {
        __type: "FieldDefinitionsFactory" as const,
        factory
    };
}

export interface FieldDefinitionsFactory<TFields extends z.ZodRawShape> {
    __type: "FieldDefinitionsFactory";
    factory: (fields: IFieldBuilderRegistry) => Record<string, FieldBuilder<any>>;
}

export type InferFieldSchema<T> =
    T extends FieldDefinitionsFactory<infer TFields> ? z.ZodObject<TFields> : never;
