import { makeAutoObservable } from "mobx";

import {
    Field,
    FieldDTO,
    FieldMapper,
    FieldRaw,
    Filter,
    FilterDTO,
    FilterGroupDTO,
    Operation
} from "../domain";

export interface QueryBuilderDrawerPresenterInterface {
    load(filter: FilterDTO): void;
    addGroup(): void;
    deleteGroup(groupIndex: number): void;
    addNewFilterToGroup(groupIndex: number): void;
    deleteFilterFromGroup(groupIndex: number, filterIndex: number): void;
    setFilterFieldData(groupIndex: number, filterIndex: number, data: string): void;
    setFilter(data: QueryBuilderFormData): void;
    onSubmit(onSuccess?: (filter: FilterDTO) => void, onError?: (filter: FilterDTO) => void): void;
    onSave(onSuccess?: (filter: FilterDTO) => void, onError?: (filter: FilterDTO) => void): void;
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
    groups: (FilterGroupDTO & { title: string; open: boolean })[];
}

export class QueryBuilderDrawerPresenter implements QueryBuilderDrawerPresenterInterface {
    private readonly fields: QueryBuilderViewModel["fields"];
    private formWasSubmitted = false;
    private invalidFields: QueryBuilderViewModel["invalidFields"] = {};
    private invalidMessage = "";
    private filter: FilterDTO;

    constructor(filter: FilterDTO, fields: FieldRaw[]) {
        this.filter = filter;
        this.fields = FieldMapper.toDTO(fields.map(field => Field.createFromRaw(field)));
        makeAutoObservable(this);
    }

    load(filter: FilterDTO) {
        this.filter = filter;
    }

    get vm() {
        return {
            name: this.filter.name,
            description: this.filter.description || "",
            fields: this.fields,
            invalidFields: this.invalidFields,
            invalidMessage: this.invalidMessage,
            data: {
                operation: this.filter.operation,
                groups: this.filter.groups.map((group: FilterGroupDTO, groupIndex) => {
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
        this.filter.groups.push({
            operation: Operation.AND,
            filters: [{ field: "", value: "", condition: "" }]
        });
    }

    deleteGroup(groupIndex: number) {
        this.filter.groups = this.filter.groups.filter((_, index) => index !== groupIndex);

        // Make sure we always have at least 1 group!
        if (this.filter.groups.length === 0) {
            this.addGroup();
        }
    }

    addNewFilterToGroup(groupIndex: number) {
        this.filter.groups[groupIndex].filters.push({
            field: "",
            value: "",
            condition: ""
        });
    }

    deleteFilterFromGroup(groupIndex: number, filterIndex: number) {
        const filters = this.filter.groups[groupIndex].filters;
        this.filter.groups[groupIndex].filters = filters.filter(
            (_, index) => index !== filterIndex
        );

        // Make sure we always have at least 1 filter!
        if (this.filter.groups[groupIndex].filters.length === 0) {
            this.filter.groups[groupIndex].filters.push({
                field: "",
                value: "",
                condition: ""
            });
        }
    }

    setFilterFieldData(groupIndex: number, filterIndex: number, data: string) {
        this.filter.groups[groupIndex].filters = [
            ...this.filter.groups[groupIndex].filters.slice(0, filterIndex),
            {
                field: data,
                value: "",
                condition: ""
            },
            ...this.filter.groups[groupIndex].filters.slice(filterIndex + 1)
        ];
    }

    setFilter(data: QueryBuilderFormData) {
        this.filter = {
            ...this.filter,
            operation: data.operation,
            groups: data.groups.map(group => ({
                operation: group.operation,
                filters: group.filters
            }))
        };

        if (this.formWasSubmitted) {
            this.validateFilter(this.filter);
        }
    }

    onSubmit(onSuccess?: (filter: FilterDTO) => void, onError?: (filter: FilterDTO) => void) {
        const result = this.validateFilter(this.filter);
        if (result.success) {
            onSuccess && onSuccess(this.filter);
        } else {
            onError && onError(this.filter);
        }
    }

    onSave(onSuccess?: (filter: FilterDTO) => void, onError?: (filter: FilterDTO) => void) {
        const result = this.validateFilter(this.filter);
        if (result.success) {
            onSuccess && onSuccess(this.filter);
        } else {
            onError && onError(this.filter);
        }
    }

    private validateFilter(data: FilterDTO) {
        this.formWasSubmitted = true;
        const validation = Filter.validate(data);

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
