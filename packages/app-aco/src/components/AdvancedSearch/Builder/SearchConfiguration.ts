import { FilterOperation } from "~/components/AdvancedSearch/types";
import { generateId } from "@webiny/utils";
import { makeAutoObservable } from "mobx";

interface FilterDTO {
    field: string;
    condition: string;
    value: string;
}

interface GroupDTO {
    operation: FilterOperation;
    filters: FilterDTO[];
}

export interface SearchConfigurationDTO {
    id: string;
    name: string;
    operation: FilterOperation;
    groups: GroupDTO[];
}

export class SearchConfiguration {
    public readonly operations = FilterOperation;
    public readonly id;
    public name = "Untitled";
    public operation: FilterOperation;
    public groups: Group[];

    static createFrom(rawData: SearchConfigurationDTO) {
        return new SearchConfiguration(
            rawData.operation,
            rawData.groups.map(groupDTO => {
                return new Group(
                    groupDTO.operation,
                    groupDTO.filters.map(filterDTO => {
                        return new Filter(filterDTO.field, filterDTO.condition, filterDTO.value);
                    })
                );
            })
        );
    }

    static createEmpty() {
        return new SearchConfiguration(FilterOperation.AND, [
            new Group(FilterOperation.AND, [new Filter()])
        ]);
    }

    private constructor(operation: FilterOperation, groups: Group[], id?: string) {
        this.id = id ?? generateId();
        this.operation = operation;
        this.groups = groups;
        makeAutoObservable(this);
    }
}

export class Group {
    public readonly operation: FilterOperation;
    public readonly filters: Filter[];

    constructor(operation: FilterOperation, filters: Filter[]) {
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
