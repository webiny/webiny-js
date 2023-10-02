import zod from "zod";
import { generateId } from "@webiny/utils";
import { Operation } from "./Operation";

export interface QueryObjectRaw {
    id: string;
    name: string;
    description?: string;
    modelId: string;
    operation: Operation;
    groups: string[];
}
export interface FilterDTO {
    field: string;
    condition: string;
    value: string;
}

export interface GroupDTO {
    operation: Operation;
    filters: FilterDTO[];
}

export interface QueryObjectDTO {
    id: string;
    name: string;
    description: string;
    modelId: string;
    operation: Operation;
    groups: GroupDTO[];
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

const validationSchema = zod.object({
    id: zod.string().trim().optional().nullish(),
    name: zod.string().trim(),
    description: zod.string().trim(),
    model: zod.string().trim(),
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
    public groups: Group[];

    static createEmpty(modelId: string) {
        return new QueryObject(modelId, Operation.AND, [new Group(Operation.AND, [new Filter()])]);
    }

    static create(modelId: string, existing?: QueryObjectDTO) {
        // Extract the properties from 'data' or use defaults
        const operation = existing?.operation || Operation.AND;
        const groups = existing?.groups || [new Group(Operation.AND, [new Filter()])];
        const id = existing?.id;
        const name = existing?.name;
        const description = existing?.description;

        // Create a new instance of QueryObject with the extracted properties
        return new QueryObject(modelId, operation, groups, id, name, description);
    }

    static validate(data: QueryObjectDTO) {
        return validationSchema.safeParse(data);
    }

    private constructor(
        modelId: string,
        operation: Operation,
        groups: Group[],
        id?: string,
        name?: string,
        description?: string
    ) {
        this.id = id ?? generateId();
        this.modelId = modelId;
        this.name = name ?? "Untitled";
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
