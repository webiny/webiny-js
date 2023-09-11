import { FilterOperation } from "~/components/AdvancedSearch/types";
import { generateId } from "@webiny/utils";
import { makeAutoObservable } from "mobx";

export class SearchConfiguration {
    public readonly operations = FilterOperation;
    private id = generateId();
    private name = "Untitled";
    private _operation = FilterOperation.AND;
    private _groups = [new Group()];

    constructor() {
        makeAutoObservable(this);
    }

    // static createFrom(rawData) {
    //     const configuration = new SearchConfiguration();
    //
    //     configuration.setOperation(rawData.operation);
    //
    //     return configuration;
    // }

    validate() {
        for (const group of this.groups) {
            group.validate();
        }
    }

    get operation() {
        return this._operation;
    }

    setOperation(operation: FilterOperation) {
        this._operation = operation;
    }

    get groups() {
        return this._groups;
    }

    addGroup() {
        this._groups = [...this.groups, new Group()];
    }

    updateGroup(group: Group) {
        const index = this.groups.findIndex(item => item.id === group.id);

        if (index === -1) {
            return;
        }

        this._groups = [...this.groups.slice(0, index), group, ...this.groups.slice(index + 1)];
    }

    deleteGroup(group: Group) {
        this._groups = this.groups.filter(item => item.id !== group.id);
    }

    toGraphql() {
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
    private _operation = FilterOperation.AND;
    private _filters = [new Filter()];

    constructor() {
        makeAutoObservable(this);
    }

    validate() {
        //TODO: handle the last filter deletion
        for (const filter of this._filters) {
            filter.validate();
        }
    }

    get filters() {
        return this._filters;
    }

    addFilter() {
        this._filters = [...this.filters, new Filter()];
    }

    deleteFilter(filter: Filter) {
        this._filters = this.filters.filter(item => item.id !== filter.id);
    }

    updateFilter(filter: Filter) {
        const index = this.filters.findIndex(item => item.id === filter.id);

        if (index === -1) {
            return;
        }

        this._filters = [...this.filters.slice(0, index), filter, ...this.filters.slice(index + 1)];
    }

    get operation() {
        return this._operation;
    }

    setOperation(operation: FilterOperation) {
        this._operation = operation;
    }
}

export class Filter {
    public readonly id = generateId();
    public field?: string = undefined;
    public condition?: string = undefined;
    public value?: string = undefined;

    constructor() {
        makeAutoObservable(this);
    }

    validate() {
        if (!this.field || !this.condition || !this.value) {
            throw Error(`Field ${this.id} is not valid`);
        }
    }
}

export interface ISearchConfigurationRepository {
    getOperations(): string[];
    getOperation(): string;
    setOperation(operation: FilterOperation): void;
    addGroup(): void;
    getGroups(): Group[];
    updateGroup(group: Group): void;
    deleteGroup(group: Group): void;
    toGraphql(): any;
    validate(): void;
}

class CurrentSearchConfigurationRepository {
    private readonly searchConfiguration: SearchConfiguration;

    constructor() {
        this.searchConfiguration = new SearchConfiguration();
        makeAutoObservable(this);
    }

    getOperations() {
        return Object.values(this.searchConfiguration.operations);
    }

    getOperation() {
        return this.searchConfiguration.operation;
    }

    setOperation(operation: FilterOperation) {
        return this.searchConfiguration.setOperation(operation);
    }

    addGroup() {
        this.searchConfiguration.addGroup();
    }

    getGroups() {
        return this.searchConfiguration.groups;
    }

    updateGroup(group: Group) {
        this.searchConfiguration.updateGroup(group);
    }

    deleteGroup(group: Group) {
        this.searchConfiguration.deleteGroup(group);
    }

    toGraphql() {
        return this.searchConfiguration.toGraphql();
    }

    validate() {
        this.searchConfiguration.validate();
    }
}
export const currentSearchConfigurationRepository = new CurrentSearchConfigurationRepository();
