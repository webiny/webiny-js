export interface BatchDTO {
    operations: OperationDTO[];
}

export class Batch {
    operations: Operation[];

    static createEmpty() {
        return new Batch([new Operation()]);
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
    public readonly value?: any = undefined;

    constructor(field?: string, operator?: string, value?: any) {
        this.field = field;
        this.operator = operator;
        this.value = value;
    }
}
