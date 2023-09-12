import { FilterOperation } from "~/components/AdvancedSearch/types";
import { generateId } from "@webiny/utils";
import { makeAutoObservable } from "mobx";

interface FilterInput {
    field: string;
    condition: string;
    value: string;
}

interface GroupInput {
    operation: FilterOperation;
    filters: FilterInput[];
}

export interface SearchConfigurationDTO {
    operation: FilterOperation;
    groups: GroupInput[];
}

export class SearchConfiguration {
    public readonly operations = FilterOperation;
    private id = generateId();
    private name = "Untitled";
    public readonly operation: FilterOperation;
    public readonly groups: Group[];

    static createFrom(rawData: SearchConfigurationDTO) {
        return new SearchConfiguration(
            rawData.operation,
            rawData.groups.map(groupDTO => {
                return new Group(
                    groupDTO.operation,
                    groupDTO.filters.map(filterDTO => {
                        return new Filter(
                            filterDTO.field,
                            filterDTO.condition,
                            filterDTO.value
                        );
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

    private constructor(operation: FilterOperation, groups: Group[]) {
        this.operation = operation;
        this.groups = groups;
    }

    toObject() {
        return {
            [this.operation]: this.groups.map(group => {
                return {
                    [group.operation]: group.filters.map(filter => {
                        const { field, condition, value } = filter;
                        const key = `${field}${condition}`.trim();

                        return { [key]: value };
                    })
                };
            })
        };
    }
}

export class Group {
    public readonly id = generateId();
    public readonly operation: FilterOperation;
    public readonly filters: Filter[];

    constructor(operation: FilterOperation, filters: Filter[]) {
        this.operation = operation;
        this.filters = filters;
    }
}

export class Filter {
    public readonly id = generateId();
    public readonly field?: string;
    public readonly condition?: string;
    public readonly value?: string;

    constructor(field?: string, condition?: string, value?: string) {
        this.field = field;
        this.condition = condition;
        this.value = value;
    }
}

export interface ISearchConfigurationRepository {
    getSearchConfiguration(): SearchConfiguration;
    setSearchConfiguration(configuration: SearchConfiguration): void;
}

class CurrentSearchConfigurationRepository {
    private searchConfiguration: SearchConfiguration;

    constructor() {
        this.searchConfiguration = SearchConfiguration.createEmpty();
        makeAutoObservable(this);
    }

    getSearchConfiguration() {
        return this.searchConfiguration;
    }

    setSearchConfiguration(configuration: SearchConfiguration) {
        this.searchConfiguration = configuration;
    }
}
export const currentSearchConfigurationRepository = new CurrentSearchConfigurationRepository();
