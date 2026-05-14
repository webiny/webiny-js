import zod from "zod";

export interface BatchDTO {
    operations: OperationDTO[];
}

const operationValidationSchema = zod.object({
    field: zod.string().trim().min(1, "Field is required."),
    operator: zod.string().min(1, "Operator is required.")
});

export const batchValidationSchema = zod.object({
    operations: zod.array(operationValidationSchema).min(1)
});

export class Batch {
    operations: Operation[];

    static createEmpty() {
        return new Batch([new Operation()]);
    }

    static validate(data: BatchDTO) {
        return batchValidationSchema.safeParse(data);
    }

    protected constructor(operations: Operation[]) {
        this.operations = operations;
    }
}

export interface OperationDTO {
    field: string;
    operator: string;
    value?: Record<string, any>;
}

export class Operation {
    public readonly field?: string;
    public readonly operator?: string;
    public readonly value?: Record<string, any> = undefined;

    constructor(field?: string, operator?: string, value?: any) {
        this.field = field;
        this.operator = operator;
        this.value = value;
    }
}
