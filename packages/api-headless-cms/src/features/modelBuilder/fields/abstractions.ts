import { createAbstraction } from "@webiny/feature/api";
import type { BaseFieldBuilder } from "./BaseFieldBuilder.js";
import type { IFieldBuilderRegistry } from "../abstractions.js";

/**
 * Field Type Factory - creates a field builder instance
 */
export interface IFieldTypeFactory {
    /** Unique identifier for this field type */
    readonly type: string;

    /** Create a new field builder instance */
    create(registry: IFieldBuilderRegistry): BaseFieldBuilder<any>;
}

/**
 * Use to implement new field types.
 */
export const FieldType = createAbstraction<IFieldTypeFactory>("FieldType");
