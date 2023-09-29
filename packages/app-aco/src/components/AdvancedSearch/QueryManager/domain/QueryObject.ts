import { Operation } from "../../QueryBuilder/domain";

export interface QueryObjectRaw {
    id: string;
    name: string;
    description?: string;
    modelId: string;
    operation: Operation;
    groups: string[];
}

export class QueryObject {
    public readonly operations = Operation;
    public readonly id;
    public name;
    public description;
    public modelId: string;
    public operation: Operation;
    public groups: Group[];

    static createFromRaw(data: QueryObjectRaw) {
        const groups = data.groups.map(group => JSON.parse(group));
        return new QueryObject(
            data.id,
            data.name,
            data.modelId,
            data.operation,
            groups,
            data.description
        );
    }

    private constructor(
        id: string,
        name: string,
        modelId: string,
        operation: Operation,
        groups: Group[],
        description?: string
    ) {
        this.id = id;
        this.name = name;
        this.modelId = modelId;
        this.description = description ?? "";
        this.operation = operation;
        this.groups = groups;
    }
}

export class Group {
    public readonly operation: Operation;
    public readonly filters: Filter[];

    constructor(operation: Operation, filters: Filter[]) {
        this.operation = operation;
        this.filters = filters;
    }
}

export class Filter {
    public readonly field?: string;
    public readonly condition?: string;
    public readonly value?: string;

    constructor(field?: string, condition?: string, value?: string) {
        this.field = field;
        this.condition = condition;
        this.value = value;
    }
}
