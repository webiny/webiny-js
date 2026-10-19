import { createAbstraction } from "@webiny/feature/admin";
import type { ICmsEntryValueTransformer } from "./abstractions.js";
import type { CmsModelField } from "~/types.js";

export interface IEntryDataPreparer {
    /**
     * Converts field values from the form shape into the GraphQL input shape.
     */
    prepare(data: Record<string, unknown>, fields: CmsModelField[]): Record<string, unknown>;
    /**
     * Prepares `data.values` of a mutation payload and keeps all other keys as they are.
     * Every gateway that sends entry values to the API must use this method.
     */
    prepareEntryData(
        data: Record<string, unknown>,
        fields: CmsModelField[]
    ): Record<string, unknown>;
}

export class EntryDataPreparerImpl implements IEntryDataPreparer {
    private transformersByType: Map<string, ICmsEntryValueTransformer> | null = null;

    constructor(private getTransformers: () => ICmsEntryValueTransformer[]) {}

    prepare(data: Record<string, unknown>, fields: CmsModelField[]): Record<string, unknown> {
        if (!this.transformersByType) {
            this.transformersByType = new Map();
            for (const t of this.getTransformers()) {
                this.transformersByType.set(t.fieldType, t);
            }
        }

        const result: Record<string, unknown> = {};

        for (const field of fields) {
            const value = data[field.fieldId];
            if (value === undefined) {
                continue;
            }

            const transformer = this.transformersByType.get(field.type);
            if (transformer) {
                result[field.fieldId] = transformer.transform(value, field);
            } else {
                result[field.fieldId] = value;
            }
        }

        return result;
    }

    prepareEntryData(
        data: Record<string, unknown>,
        fields: CmsModelField[]
    ): Record<string, unknown> {
        const values = data.values;
        if (!values || typeof values !== "object") {
            return data;
        }
        return {
            ...data,
            values: this.prepare(values as Record<string, unknown>, fields)
        };
    }
}

export const EntryDataPreparer = createAbstraction<IEntryDataPreparer>("EntryDataPreparer");

export namespace EntryDataPreparer {
    export type Interface = IEntryDataPreparer;
}
