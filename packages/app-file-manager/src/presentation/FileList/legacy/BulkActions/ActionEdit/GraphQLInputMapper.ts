// @ts-nocheck
import set from "lodash/set.js";
import get from "lodash/get.js";
import type { FileItem } from "~/domain/types.js";
import type { BatchDTO } from "~/presentation/FileList/legacy/BulkActions/ActionEdit/domain/index.js";
import { OperatorType } from "~/presentation/FileList/legacy/BulkActions/ActionEdit/domain/index.js";

export class GraphQLInputMapper {
    static applyOperations(data: FileItem, batch: BatchDTO) {
        const update = { ...data };

        batch.operations.forEach(operation => {
            const { field, operator, value } = operation;
            const fieldValue = get(value, field);

            switch (operator) {
                case OperatorType.OVERRIDE:
                    if (!fieldValue) {
                        return;
                    }

                    set(update, field, fieldValue);
                    break;
                case OperatorType.REMOVE:
                    set(update, field, null);
                    break;
                case OperatorType.APPEND:
                    if (!value || !fieldValue || !Array.isArray(fieldValue)) {
                        return;
                    }

                    const oldData = (data && get(data, field)) ?? [];
                    set(update, field, [...oldData, ...fieldValue]);

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
