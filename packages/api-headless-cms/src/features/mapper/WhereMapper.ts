import { GenericRecord } from "@webiny/api/types.js";
import { CmsEntryListWhere } from "~/types/types.js";
import { CmsFieldInputToWhereMapper, ICmsFieldInputToWhereMapperParams } from "./abstractions.js";

class WhereMapperImpl implements CmsFieldInputToWhereMapper.Interface {
    map<T extends GenericRecord>(
        params: ICmsFieldInputToWhereMapperParams<T>
    ): CmsEntryListWhere | undefined {
        const { fields: modelFields, input } = params;
        if (!input) {
            return undefined;
        }

        const keys = Object.getOwnPropertyNames(input); // as (keyof typeof input)[];
        if (keys.length === 0) {
            return undefined;
        }

        const fields = modelFields.map(field => {
            return field.fieldId;
        });

        const isField = (input: string): boolean => {
            const field = input.split("_")[0];
            return fields.includes(field);
        };

        const where: CmsEntryListWhere = {};

        for (const key of keys) {
            const value = input[key];
            if (isField(key)) {
                where.values = {
                    ...where.values,
                    [key]: value
                };
                continue;
            }
            where[key as keyof typeof where] = value;
        }

        return where;
    }
}

export const WhereMapper = CmsFieldInputToWhereMapper.createImplementation({
    implementation: WhereMapperImpl,
    dependencies: []
});
