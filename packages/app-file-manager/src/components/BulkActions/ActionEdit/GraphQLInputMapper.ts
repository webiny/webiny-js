import { immutableGet, mutableSet } from "@webiny/app/utils/index.js";
import type { FileItem } from "~/types.js";
import type { BatchDTO } from "~/components/BulkActions/ActionEdit/domain/index.js";
import { OperatorType } from "~/components/BulkActions/ActionEdit/domain/index.js";

export class GraphQLInputMapper {
    static applyOperations(data: FileItem, batch: BatchDTO) {
        const update = { ...data };

        batch.operations.forEach(operation => {
            const { field, operator, value } = operation;
            const fieldValue = immutableGet(value, field);

            switch (operator) {
                case OperatorType.OVERRIDE:
                    if (!fieldValue) {
                        return;
                    }

                    mutableSet(update, field, fieldValue);
                    break;
                case OperatorType.REMOVE:
                    mutableSet(update, field, null);
                    break;
                case OperatorType.APPEND:
                    if (!value || !fieldValue || !Array.isArray(fieldValue)) {
                        return;
                    }

                    const oldData = (data && immutableGet<unknown[]>(data, field)) || [];
                    mutableSet(update, field, [...oldData, ...fieldValue]);

                    break;
                default:
                    break;
            }
        });

        return {
            ...data,
            ...update
        };
    }
}
