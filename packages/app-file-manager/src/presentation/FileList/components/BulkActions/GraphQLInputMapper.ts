import { immutableGet, mutableSet } from "@webiny/stdlib";
import type { FileItem } from "~/domain/types.js";
import type { BatchDTO } from "~/presentation/FileList/components/BulkActions/domain/index.js";
import { OperatorType } from "~/presentation/FileList/components/BulkActions/domain/index.js";

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

                    const oldData = immutableGet(data, field, []);
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
