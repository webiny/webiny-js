import { makeAutoObservable } from "mobx";
import {
    Field,
    FieldDTO,
    FieldMapper,
    FieldRaw,
    GroupDTO,
    Operation,
    QueryObject,
    QueryObjectDTO
} from "../../QueryObject";

export interface IQueryBuilderPresenter {
    addGroup: () => void;
    addNewFilterToGroup: (groupIndex: number) => void;
    deleteFilterFromGroup: (groupIndex: number, filterIndex: number) => void;
    deleteGroup: (groupIndex: number) => void;
    emptyFilterIntoGroup: (groupIndex: number, filterIndex: number) => void;
    onSubmit: (
        onSuccess?: (queryObject: QueryObjectDTO) => void,
        onError?: (queryObject: QueryObjectDTO) => void
    ) => void;
    setQueryObject: (queryObject: QueryObjectDTO) => void;
    updateViewModel: () => void;
}

export interface QueryBuilderViewModel {
    name: string;
    description: string;
    fields: FieldDTO[];
    invalidFields: Record<string, { isValid: boolean; message: string }>;
    data: QueryBuilderFormData;
}

export interface QueryBuilderFormData {
    operation: Operation;
    groups: (GroupDTO & { title: string; open: boolean })[];
}

export class QueryBuilderPresenter {
    private readonly fields: QueryBuilderViewModel["fields"];
    private formWasSubmitted = false;
    private invalidFields: QueryBuilderViewModel["invalidFields"] = {};
    private queryObject: QueryObjectDTO;

    constructor(queryObject: QueryObjectDTO, fields: FieldRaw[]) {
        this.queryObject = queryObject;
        this.fields = FieldMapper.toDTO(fields.map(field => Field.createFromRaw(field)));
        makeAutoObservable(this);
    }

    get vm() {
        return {
            name: this.queryObject.name,
            description: this.queryObject.description,
            fields: this.fields,
            invalidFields: this.invalidFields,
            data: {
                operation: this.queryObject.operation,
                groups: this.queryObject.groups.map((group: GroupDTO, groupIndex) => {
                    return {
                        title: `Filter group #${groupIndex + 1}`,
                        open: groupIndex === 0,
                        operation: group.operation,
                        filters: group.filters.map(filter => ({
                            field: filter.field,
                            condition: filter.condition,
                            value: filter.value
                        }))
                    };
                })
            }
        };
    }

    addGroup() {
        this.queryObject.groups.push({
            operation: Operation.AND,
            filters: [{ field: "", value: "", condition: "" }]
        });
    }

    deleteGroup(groupIndex: number) {
        this.queryObject.groups = this.queryObject.groups.filter(
            (_, index) => index !== groupIndex
        );

        // Make sure we always have at least 1 group!
        if (this.queryObject.groups.length === 0) {
            this.queryObject.groups.push({
                operation: Operation.AND,
                filters: [{ field: "", value: "", condition: "" }]
            });
        }
    }

    addNewFilterToGroup(groupIndex: number) {
        this.queryObject.groups[groupIndex].filters.push({
            field: "",
            value: "",
            condition: ""
        });
    }

    deleteFilterFromGroup(groupIndex: number, filterIndex: number) {
        const filters = this.queryObject.groups[groupIndex].filters;
        this.queryObject.groups[groupIndex].filters = filters.filter(
            (_, index) => index !== filterIndex
        );

        // Make sure we always have at least 1 filter!
        if (this.queryObject.groups[groupIndex].filters.length === 0) {
            this.queryObject.groups[groupIndex].filters.push({
                field: "",
                value: "",
                condition: ""
            });
        }
    }

    emptyFilterIntoGroup(groupIndex: number, filterIndex: number) {
        this.queryObject.groups[groupIndex].filters = [
            ...this.queryObject.groups[groupIndex].filters.slice(0, filterIndex),
            {
                field: "",
                value: "",
                condition: ""
            },
            ...this.queryObject.groups[groupIndex].filters.slice(filterIndex + 1)
        ];
    }

    setQueryObject(data: QueryBuilderFormData) {
        this.queryObject = {
            ...this.queryObject,
            operation: data.operation,
            groups: data.groups.map(group => ({
                operation: group.operation,
                filters: group.filters
            }))
        };

        if (this.formWasSubmitted) {
            this.validateQueryObject(this.queryObject);
        }
    }

    onSubmit(
        onSuccess?: (queryObject: QueryObjectDTO) => void,
        onError?: (queryObject: QueryObjectDTO) => void
    ) {
        const result = this.validateQueryObject(this.queryObject);
        if (result.success) {
            onSuccess && onSuccess(this.queryObject);
        } else {
            onError && onError(this.queryObject);
        }
    }

    onSave(
        onSuccess?: (queryObject: QueryObjectDTO) => void,
        onError?: (queryObject: QueryObjectDTO) => void
    ) {
        const result = this.validateQueryObject(this.queryObject);
        if (result.success) {
            onSuccess && onSuccess(this.queryObject);
        } else {
            onError && onError(this.queryObject);
        }
    }

    private validateQueryObject(data: QueryObjectDTO) {
        this.formWasSubmitted = true;
        const validation = QueryObject.validate(data);

        if (!validation.success) {
            this.invalidFields = validation.error.issues.reduce((acc, issue) => {
                return {
                    ...acc,
                    [issue.path.join(".")]: issue.message
                };
            }, {});
        } else {
            this.invalidFields = {};
        }

        return validation;
    }
}
