import { Batch, BatchDTO } from "./Batch";

export class BatchMapper {
    static toDTO(input: Batch): BatchDTO {
        return {
            operations: input.operations.map(operation => ({
                operator: operation.operator || "",
                field: operation.field || "",
                value: operation.value || undefined
            }))
        };
    }
}
