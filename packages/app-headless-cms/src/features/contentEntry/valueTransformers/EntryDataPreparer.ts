import { createAbstraction } from "@webiny/feature/admin";
import type { ICmsEntryValueTransformer } from "./abstractions.js";
import type { CmsModelField } from "~/types.js";

export interface IEntryDataPreparer {
    prepare(data: Record<string, unknown>, fields: CmsModelField[]): Record<string, unknown>;
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
}

export const EntryDataPreparer = createAbstraction<IEntryDataPreparer>("EntryDataPreparer");

export namespace EntryDataPreparer {
    export type Interface = IEntryDataPreparer;
}
