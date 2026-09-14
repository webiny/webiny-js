/**
 * Used to map a model with custom schema with fields in a root to values object.
 * eg. File Manager File model has "title" and "tags" fields in the root, but they should be
 * mapped to "values.title" and "values.tags" when creating the entry.
 */
import { GenericRecord } from "@webiny/api/types.js";
import { CmsEntryListWhere } from "~/types/types.js";
import { CmsWhereMapper, ICmsWhereMapperParams } from "./abstractions.js";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    if (!value || typeof value !== "object") {
        return false;
    } else if (Array.isArray(value)) {
        return false;
    }
    return true;
};

const isLogicalKey = (key: string): key is "AND" | "OR" => {
    return key === "AND" || key === "OR";
};

interface IMapNodeWhereParams {
    input: GenericRecord;
    isField: (key: string) => boolean;
}

class WhereMapperImpl implements CmsWhereMapper.Interface {
    map<T extends GenericRecord>(params: ICmsWhereMapperParams<T>): CmsEntryListWhere | undefined {
        const { fields: modelFields, input } = params;
        if (!input) {
            return undefined;
        }

        /*
         * Longest fieldId first, so a key is attributed to the longest field it could belong to.
         * Taking the segment before the first `_` misreads any fieldId that contains one:
         * `on_sale_contains` resolves to a field named `on`, which does not exist, so the filter
         * silently stays at the top level and the CMS rejects it. Longest-first also keeps a model
         * with both `price` and `price_range` from being mis-routed.
         */
        const fields = modelFields.map(field => field.fieldId).sort((a, b) => b.length - a.length);

        const isField = (key: string): boolean => {
            return fields.some(fieldId => key === fieldId || key.startsWith(`${fieldId}_`));
        };

        return this.mapWhere({
            input,
            isField
        });
    }

    private mapWhere(params: IMapNodeWhereParams) {
        const { input, isField } = params;
        const out: CmsEntryListWhere = {};

        const keys = Object.keys(input) as (keyof typeof out)[];
        if (keys.length === 0) {
            return out;
        }

        for (const key of keys) {
            const value = input[key];

            if (isLogicalKey(key)) {
                if (Array.isArray(value)) {
                    out[key] = value.filter(isPlainObject).map(child => {
                        return this.mapWhere({
                            input: child,
                            isField
                        });
                    });
                }
                continue;
            } else if (key === "values" && isPlainObject(value)) {
                /*
                 * A caller that already nested its model fields is taken at its word. Merged rather
                 * than assigned, so an explicit `values` object and flat field keys can coexist:
                 * assigning would drop whichever of the two arrived first.
                 */
                if (!out.values) {
                    out.values = {};
                }
                Object.assign(out.values, value);
                continue;
            } else if (isField(key)) {
                if (!out.values) {
                    out.values = {};
                }
                out.values[key] = value;
                continue;
            }

            out[key] = value;
        }

        return out;
    }
}

export const WhereMapper = CmsWhereMapper.createImplementation({
    implementation: WhereMapperImpl,
    dependencies: []
});
