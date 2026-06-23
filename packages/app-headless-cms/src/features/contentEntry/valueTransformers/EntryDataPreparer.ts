import { CmsEntryValueTransformer, type ICmsEntryValueTransformer } from "./abstractions.js";
import type { CmsModelField } from "~/types.js";

export interface IEntryDataPreparer {
    prepare(data: Record<string, unknown>, fields: CmsModelField[]): Record<string, unknown>;
}

class EntryDataPreparerImpl implements IEntryDataPreparer {
    private transformersByType: Map<string, ICmsEntryValueTransformer>;

    constructor(transformers: ICmsEntryValueTransformer[]) {
        this.transformersByType = new Map();
        for (const t of transformers) {
            this.transformersByType.set(t.fieldType, t);
        }
    }

    prepare(data: Record<string, unknown>, fields: CmsModelField[]): Record<string, unknown> {
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
}

import { createAbstraction } from "@webiny/feature/admin";

export const EntryDataPreparer = createAbstraction<IEntryDataPreparer>("EntryDataPreparer");

export namespace EntryDataPreparer {
    export type Interface = IEntryDataPreparer;
}

export const EntryDataPreparerImplementation = EntryDataPreparer.createImplementation({
    implementation: EntryDataPreparerImpl,
    dependencies: [[CmsEntryValueTransformer, { multiple: true }]]
});
