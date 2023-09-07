import { FilterOperation, FilterValue } from "~/components/AdvancedSearch/types";
import { generateId } from "@webiny/utils";
import { makeAutoObservable } from "mobx";

export class SearchConfiguration {
    private id = generateId();
    private name = "Untitled";
    private operation = FilterOperation.AND;
    private groups = [new Group()];

    constructor() {
        makeAutoObservable(this);
    }

    validate() {
        for (const group of this.groups) {
            group.validate();
        }
    }

    addGroup() {
        this.groups = [...this.groups, new Group()];
    }

    getGroups() {
        console.log(this.groups);
        return this.groups;
    }
}

export class Group {
    private operation = FilterOperation.AND;
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

    addFilter() {
        console.log("Add filter");
        this._filters = [...this._filters, new Filter()];
    }

    get filters() {
        return this._filters;
    }

    setOperation(operation: FilterOperation) {
        this.operation = operation;
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
