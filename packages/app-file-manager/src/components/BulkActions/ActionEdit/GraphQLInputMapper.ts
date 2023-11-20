import { BatchDTO, OperatorType } from "~/components/BulkActions/ActionEdit/domain";
import { FileItem } from "@webiny/app-admin/types";

export class GraphQLInputMapper {
    static toGraphQLExtensions(data: FileItem["extensions"], batch: BatchDTO) {
        let update = { ...data };

        batch.operations.forEach(operation => {
            const { field, operator, value } = operation;

            switch (operator) {
                case OperatorType.OVERRIDE:
                    update = {
                        ...update,
                        ...value
                    };
                    break;
                case OperatorType.REMOVE:
                    update[field] = null;
                    break;
                case OperatorType.APPEND:
                    if (!value || !value[field] || !Array.isArray(value[field])) {
                        return;
                    }

                    if (data && data[field]) {
                        update[field] = [...data[field], ...value[field]];
                    }

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
