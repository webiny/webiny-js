import zod from "zod";
import { Operation } from "./Operation";

export interface QueryObjectFilterDTO {
    field: string;
    condition: string;
    value: string;
}

export interface QueryObjectGroupDTO {
    operation: Operation;
    filters: QueryObjectFilterDTO[];
}

export interface QueryObjectDTO {
    id: string;
    name: string;
    description?: string;
    modelId: string;
    operation: Operation;
    groups: QueryObjectGroupDTO[];
}

const operationValidator = zod.enum([Operation.AND, Operation.OR]);

const filterValidationSchema = zod.object({
    field: zod.string().trim().nonempty("Field is required."),
    condition: zod.string().nonempty("Condition is required."),
    value: zod.union([
        zod.boolean(),
        zod.number({
            required_error: "Value is required.",
            invalid_type_error: "Value must be a number."
        }),
        zod.string().trim().nonempty("Value is required."),
        zod
            .array(zod.union([zod.boolean(), zod.number(), zod.string()]))
            .nonempty("At least one value is required.")
    ])
});

const groupValidationSchema = zod.object({
    operation: operationValidator,
    filters: zod.array(filterValidationSchema).min(1)
});

export const queryObjectValidationSchema = zod.object({
    id: zod.string().trim().optional().nullish(),
    name: zod.string().trim().nonempty("Name is required."),
    description: zod.string().trim(),
    modelId: zod.string().trim(),
    operation: operationValidator,
    groups: zod.array(groupValidationSchema).min(1)
});

export class QueryObject {
    public readonly operations = Operation;
    public readonly id;
    public name;
    public description;
    public modelId: string;
    public operation: Operation;
    public groups: QueryObjectGroup[];

    static createEmpty(modelId: string) {
        return new QueryObject(modelId, Operation.AND, [
            new QueryObjectGroup(Operation.AND, [new QueryObjectFilter()])
        ]);
    }

    static create(queryObjectDto: QueryObjectDTO) {
        const { modelId, operation, groups, id, name, description } = queryObjectDto;

        return new QueryObject(modelId, operation, groups, id, name, description);
    }

    static validate(data: QueryObjectDTO) {
        return queryObjectValidationSchema.safeParse(data);
    }

    protected constructor(
        modelId: string,
        operation: Operation,
        groups: QueryObjectGroup[],
        id?: string,
        name?: string,
        description?: string
    ) {
        this.id = id ?? "";
        this.modelId = modelId;
        this.name = name ?? "Draft filter";
        this.description = description ?? "";
        this.operation = operation;
        this.groups = groups;
    }
}

export class QueryObjectGroup {
    public readonly operation: Operation;
    public readonly filters: QueryObjectFilter[];

    constructor(operation: Operation, filters: QueryObjectFilter[]) {
        this.operation = operation;
        this.filters = filters;
    }
}

export class QueryObjectFilter {
    public readonly field?: string;
    public readonly condition?: string;
    public readonly value?: string;

    constructor(field?: string, condition?: string, value?: string) {
        this.field = field;
        this.condition = condition;
        this.value = value;
    }
}
