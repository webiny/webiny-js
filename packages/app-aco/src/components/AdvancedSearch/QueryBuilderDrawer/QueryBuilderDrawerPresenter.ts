import { makeAutoObservable } from "mobx";

import {
    Field,
    FieldDTO,
    FieldMapper,
    FieldRaw,
    QueryObjectGroupDTO,
    Operation,
    QueryObject,
    QueryObjectDTO
} from "../domain";

export interface QueryBuilderDrawerPresenterInterface {
    load(queryObject: QueryObjectDTO): void;
    addGroup(): void;
    deleteGroup(groupIndex: number): void;
    addNewFilterToGroup(groupIndex: number): void;
    deleteFilterFromGroup(groupIndex: number, filterIndex: number): void;
    setFilterFieldData(groupIndex: number, filterIndex: number, data: string): void;
    setQueryObject(data: QueryBuilderFormData): void;
    onSubmit(
        onSuccess?: (queryObject: QueryObjectDTO) => void,
        onError?: (queryObject: QueryObjectDTO) => void
    ): void;
    onSave(
        onSuccess?: (queryObject: QueryObjectDTO) => void,
        onError?: (queryObject: QueryObjectDTO) => void
    ): void;
    get vm(): QueryBuilderViewModel;
}

export interface QueryBuilderViewModel {
    name: string;
    description: string;
    fields: FieldDTO[];
    invalidFields: Record<string, { isValid: boolean; message: string }>;
    invalidMessage: string;
    data: QueryBuilderFormData;
}

export interface QueryBuilderFormData {
    operation: Operation;
    groups: (QueryObjectGroupDTO & { title: string; open: boolean })[];
}

export class QueryBuilderDrawerPresenter implements QueryBuilderDrawerPresenterInterface {
    private readonly fields: QueryBuilderViewModel["fields"];
    private formWasSubmitted = false;
    private invalidFields: QueryBuilderViewModel["invalidFields"] = {};
    private invalidMessage = "";
    private queryObject: QueryObjectDTO;

    constructor(queryObject: QueryObjectDTO, fields: FieldRaw[]) {
        this.queryObject = queryObject;
        this.fields = FieldMapper.toDTO(fields.map(field => Field.createFromRaw(field)));
        makeAutoObservable(this);
    }

    load(queryObject: QueryObjectDTO) {
        this.queryObject = queryObject;
    }

    get vm() {
        return {
            name: this.queryObject.name,
            description: this.queryObject.description || "",
            fields: this.fields,
            invalidFields: this.invalidFields,
            invalidMessage: this.invalidMessage,
            data: {
                operation: this.queryObject.operation,
                groups: this.queryObject.groups.map((group: QueryObjectGroupDTO, groupIndex) => {
                    return {
                        title: `Filter group #${groupIndex + 1}`,
                        open: true,
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
            this.addGroup();
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

    setFilterFieldData(groupIndex: number, filterIndex: number, data: string) {
        this.queryObject.groups[groupIndex].filters = [
            ...this.queryObject.groups[groupIndex].filters.slice(0, filterIndex),
            {
                field: data,
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
            this.invalidMessage = "Error during the validation: check the filter configuration.";
            this.invalidFields = validation.error.issues.reduce((acc, issue) => {
                return {
                    ...acc,
                    [issue.path.join(".")]: issue.message
                };
            }, {});
        } else {
            this.invalidMessage = "";
            this.invalidFields = {};
        }

        return validation;
    }
}
