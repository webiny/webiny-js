import { createAbstraction } from "@webiny/feature/api";
import type { FieldBuilder } from "./FieldBuilder.js";
import type { IFieldBuilderRegistry } from "../abstractions.js";

/**
 * Field Type Factory - creates a field builder instance
 */
export interface IFieldTypeFactory {
    /** Unique identifier for this field type */
    readonly type: string;

    /** Create a new field builder instance */
    create(registry: IFieldBuilderRegistry): FieldBuilder<any>;
}

/**
 * Field Type abstraction - use with { multiple: true } in DI
 */
export const FieldType = createAbstraction<IFieldTypeFactory>("FieldType");
