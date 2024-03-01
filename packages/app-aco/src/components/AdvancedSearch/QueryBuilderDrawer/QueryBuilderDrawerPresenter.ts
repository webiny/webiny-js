import { makeAutoObservable } from "mobx";

import { Filter, FilterDTO, FilterGroupDTO, FilterGroupFilterDTO, Operation } from "../domain";

export interface QueryBuilderDrawerPresenterInterface {
    load(filter: FilterDTO): void;
    addGroup(): void;
    deleteGroup(groupIndex: number): void;
    addNewFilterToGroup(groupIndex: number): void;
    deleteFilterFromGroup(groupIndex: number, filterIndex: number): void;
    setFilterFieldData(groupIndex: number, filterIndex: number, data: string): void;
    setFilter(data: QueryBuilderFormData): void;
    onApply(onSuccess?: (filter: FilterDTO) => void, onError?: (filter: FilterDTO) => void): void;
    onSave(onSuccess?: (filter: FilterDTO) => void, onError?: (filter: FilterDTO) => void): void;
    get vm(): QueryBuilderViewModel;
}

export interface QueryBuilderViewModel {
    name: string;
    description: string;
    invalidFields: Record<string, { isValid: boolean; message: string }>;
    invalidMessage: string;
    data: QueryBuilderFormData;
}

export interface QueryBuilderFormData {
    operation: Operation;
    groups: {
        operation: Operation;
        title: string;
        open: boolean;
        canDelete: boolean;
        filters: (FilterGroupFilterDTO & { canDelete: boolean })[];
    }[];
}

export class QueryBuilderDrawerPresenter implements QueryBuilderDrawerPresenterInterface {
    private formWasSubmitted = false;
    private invalidFields: QueryBuilderViewModel["invalidFields"] = {};
    private invalidMessage = "";
    private filter: FilterDTO | undefined;

    constructor() {
        this.filter = undefined;
        makeAutoObservable(this);
    }

    load(filter: FilterDTO) {
        this.filter = filter;
    }

    get vm() {
        return {
            name: this.filter?.name || "",
            description: this.filter?.description || "",
            invalidFields: this.invalidFields,
            invalidMessage: this.invalidMessage,
            data: {
                operation: this.filter?.operation || Operation.AND,
                groups:
                    this.filter?.groups.map((group: FilterGroupDTO, groupIndex) => {
                        return {
                            title: `Filter group #${groupIndex + 1}`,
                            open: true,
                            operation: group.operation,
                            canDelete: groupIndex !== 0,
                            filters: group.filters.map((filter, filterIndex) => ({
                                field: filter.field,
                                condition: filter.condition,
                                value: filter.value,
                                canDelete: filterIndex !== 0
                            }))
                        };
                    }) || []
            }
        };
    }

    addGroup() {
        if (!this.filter) {
            return;
        }

        this.filter.groups.push({
            operation: Operation.AND,
            filters: [{ field: "", value: "", condition: "" }]
        });
    }

    deleteGroup(groupIndex: number) {
        if (!this.filter) {
            return;
        }

        this.filter.groups = this.filter.groups.filter((_, index) => index !== groupIndex);

        // Make sure we always have at least 1 group!
        if (this.filter.groups.length === 0) {
            this.addGroup();
        }
    }

    addNewFilterToGroup(groupIndex: number) {
        if (!this.filter) {
            return;
        }

        this.filter.groups[groupIndex].filters.push({
            field: "",
            value: "",
            condition: ""
        });
    }

    deleteFilterFromGroup(groupIndex: number, filterIndex: number) {
        if (!this.filter) {
            return;
        }

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
        if (!this.filter) {
            return;
        }

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
        if (!this.filter) {
            return;
        }

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

    onApply(onSuccess?: (filter: FilterDTO) => void, onError?: (filter: FilterDTO) => void) {
        if (!this.filter) {
            return;
        }

        const result = this.validateFilter(this.filter);
        if (result.success) {
            onSuccess && onSuccess(this.filter);
        } else {
            onError && onError(this.filter);
        }
    }

    onSave(onSuccess?: (filter: FilterDTO) => void, onError?: (filter: FilterDTO) => void) {
        if (!this.filter) {
            return;
        }

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
