import zod from "zod";
import { Operation } from "./Operation";
import {
    QueryObjectGroup,
    QueryObject,
    QueryObjectDTO,
    queryObjectValidationSchema
} from "./QueryObject";

export interface User {
    id: string;
    type: string;
    displayName: string | null;
}

export interface FilterDTO extends QueryObjectDTO {
    createdOn?: string;
    createdBy?: User;
    savedOn?: string;
}

export interface FilterRaw extends Omit<FilterDTO, "groups"> {
    groups: string[];
}

export const filterValidationSchema = zod.union([
    queryObjectValidationSchema,
    zod.object({
        createdOn: zod.date().optional(),
        savedOn: zod.date().optional(),
        createdBy: zod
            .object({
                id: zod.string().nonempty(),
                type: zod.string().nonempty(),
                displayName: zod.string().nullish()
            })
            .optional()
    })
]);

export class Filter extends QueryObject {
    public createdOn?: string;
    public savedOn?: string;
    public createdBy?: User;

    static override createEmpty(namespace: string) {
        const queryObject = QueryObject.createEmpty(namespace);

        return new Filter(
            queryObject.namespace,
            queryObject.operation,
            queryObject.groups,
            queryObject.id,
            queryObject.name,
            queryObject.description
        );
    }

    static override create(filterDto: FilterDTO) {
        const queryObject = QueryObject.create({
            namespace: filterDto.namespace,
            operation: filterDto.operation,
            groups: filterDto.groups,
            id: filterDto.id,
            name: filterDto.name,
            description: filterDto.description
        });

        return new Filter(
            queryObject.namespace,
            queryObject.operation,
            queryObject.groups,
            queryObject.id,
            queryObject.name,
            queryObject.description,
            filterDto.createdOn,
            filterDto.savedOn,
            filterDto.createdBy
        );
    }

    static override validate(data: FilterDTO) {
        const validation = filterValidationSchema.safeParse(data);
        if (validation.success) {
            return QueryObject.validate(data);
        } else {
            return validation;
        }
    }

    protected constructor(
        namespace: string,
        operation: Operation,
        groups: QueryObjectGroup[],
        id?: string,
        name?: string,
        description?: string,
        createdOn?: string,
        savedOn?: string,
        createdBy?: User
    ) {
        super(namespace, operation, groups, id, name, description);

        this.createdOn = createdOn;
        this.createdBy = createdBy;
        this.savedOn = savedOn;
    }
}
