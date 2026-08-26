import { CmsEntryValueTransformer, type ICmsEntryValueTransformer } from "./abstractions.js";
import { EntryDataPreparer, type IEntryDataPreparer } from "./EntryDataPreparer.js";
import type { CmsModelField } from "~/types.js";

class ObjectValueTransformerImpl implements ICmsEntryValueTransformer {
    readonly fieldType = "object";

    constructor(private preparer: IEntryDataPreparer) {}

    transform(value: unknown, field: CmsModelField): unknown {
        const childFields: CmsModelField[] = field.settings?.fields || [];

        if (!value || childFields.length === 0) {
            return value;
        }

        if (field.list && Array.isArray(value)) {
            return value.map(item => {
                if (item && typeof item === "object") {
                    const { _id, ...rest } = item as Record<string, unknown>;
                    const prepared = this.preparer.prepare(rest, childFields);
                    return _id !== undefined ? { _id, ...prepared } : prepared;
                }
                return item;
            });
        }

        if (typeof value === "object") {
            return this.preparer.prepare(value as Record<string, unknown>, childFields);
        }

        return value;
    }
}

export const ObjectValueTransformer = CmsEntryValueTransformer.createImplementation({
    implementation: ObjectValueTransformerImpl,
    dependencies: [EntryDataPreparer]
});
