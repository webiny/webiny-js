import zod from "zod";
import type { NonEmptyArray } from "@webiny/api/types.js";
import type { IResolverRecordBodyItem } from "~/resolver/app/abstractions/ResolverRecord.js";
import { createSystemValidation } from "./system.js";
import { DynamoDBTableType } from "~/types.js";

const convert = (input: IResolverRecordBodyItem[]) => {
    /**
     * We can safely cast as NonEmptyArray<IResolverRecordBodyItem> here because we already validated that the array is not empty.
     */
    return input as NonEmptyArray<IResolverRecordBodyItem>;
};

const transformTableType = (input: string): DynamoDBTableType => {
    const keys = Object.keys(DynamoDBTableType) as (keyof typeof DynamoDBTableType)[];
    for (const key of keys) {
        const value = DynamoDBTableType[key];
        if (value === input) {
            return value;
        }
    }
    return DynamoDBTableType.UNKNOWN;
};

export const createDetailValidation = () => {
    return zod.object({
        items: zod
            .array(
                zod.object({
                    PK: zod.string(),
                    SK: zod.string(),
                    tableName: zod.string(),
                    tableType: zod
                        .enum(["regular", "elasticsearch", "log", "unknown"])
                        .transform(input => {
                            return transformTableType(input);
                        }),
                    command: zod.enum(["update", "put", "delete"])
                })
            )
            .refine(
                values => {
                    return values.length > 0;
                },
                {
                    message: `"items" array must not be empty.`
                }
            )
            .transform(values => {
                return convert(values);
            }),
        source: createSystemValidation(),
        id: zod.string()
    });
};
