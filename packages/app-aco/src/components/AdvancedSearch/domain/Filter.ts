import zod from "zod";
import { Operation } from "./Operation";

export interface User {
    id: string;
    type: string;
    displayName: string | null;
}

export interface FilterGroupFilterDTO {
    field: string;
    condition: string;
    value: string;
}

export interface FilterGroupDTO {
    operation: Operation;
    filters: FilterGroupFilterDTO[];
}

export interface FilterDTO {
    id: string;
    name: string;
    description?: string;
    namespace: string;
    operation: Operation;
    groups: FilterGroupDTO[];
    createdOn?: string;
    createdBy?: User;
    savedOn?: string;
}

export interface FilterRaw extends Omit<FilterDTO, "groups"> {
    groups: string[];
}

const operationValidator = zod.enum([Operation.AND, Operation.OR]);

const filterGroupFilterValidationSchema = zod.object({
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

const filterGroupValidationSchema = zod.object({
    operation: operationValidator,
    filters: zod.array(filterGroupFilterValidationSchema).min(1)
});

export const filterValidationSchema = zod.object({
    id: zod.string().trim().optional().nullish(),
    name: zod.string().trim().nonempty("Name is required."),
    description: zod.string().trim(),
    namespace: zod.string().trim(),
    operation: operationValidator,
    groups: zod.array(filterGroupValidationSchema).min(1),
    createdOn: zod.date().optional(),
    savedOn: zod.date().optional(),
    createdBy: zod
        .object({
            id: zod.string().nonempty(),
            type: zod.string().nonempty(),
            displayName: zod.string().nullish()
        })
        .optional()
});

export class Filter {
    public readonly operations = Operation;
    public readonly id;
    public name;
    public description;
    public namespace: string;
    public operation: Operation;
    public groups: FilterGroup[];
    public createdOn?: string;
    public savedOn?: string;
    public createdBy?: User;

    static createEmpty(namespace: string) {
        return new Filter({
            namespace,
            operation: Operation.AND,
            groups: [new FilterGroup(Operation.AND, [new FilterGroupFilter()])]
        });
    }

    static create(data: FilterDTO) {
        return new Filter(data);
    }

    static validate(data: FilterDTO) {
        return filterValidationSchema.safeParse(data);
    }

    protected constructor(data: {
        namespace: string;
        operation: Operation;
        groups: FilterGroup[];
        id?: string;
        name?: string;
        description?: string;
        createdOn?: string;
        savedOn?: string;
        createdBy?: User;
    }) {
        this.id = data.id ?? "";
        this.namespace = data.namespace;
        this.name = data.name ?? "Draft filter";
        this.description = data.description ?? "";
        this.operation = data.operation;
        this.groups = data.groups;
        this.createdOn = data.createdOn;
        this.createdBy = data.createdBy;
        this.savedOn = data.savedOn;
    }
}

export class FilterGroup {
    public readonly operation: Operation;
    public readonly filters: FilterGroupFilter[];

    constructor(operation: Operation, filters: FilterGroupFilter[]) {
        this.operation = operation;
        this.filters = filters;
    }
}

export class FilterGroupFilter {
    public readonly field?: string;
    public readonly condition?: string;
    public readonly value?: string;

    constructor(field?: string, condition?: string, value?: string) {
        this.field = field;
        this.condition = condition;
        this.value = value;
    }
}
