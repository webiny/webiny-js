import type { FieldSortOptions } from "~/types.js";
import type { SortOrder } from "~/types.js";
import type { OpenSearchField } from "./abstractions/OpenSearchField.js";

const keywordLessUnmappedType = ["date", "long"];

const unmappedTypeHasKeyword = (type?: string): boolean => {
    if (!type) {
        return true;
    } else if (keywordLessUnmappedType.includes(type)) {
        return false;
    }
    return true;
};

export class OpenSearchFieldImpl implements OpenSearchField.Interface {
    public readonly field: string;
    public readonly path: string;
    public readonly keyword: boolean;
    public readonly unmappedType?: string;
    public readonly sortable: boolean;
    public readonly searchable: boolean;
    private readonly searchValueFn?: (params: OpenSearchField.SearchValueParams) => any;

    public constructor(params: OpenSearchField.Params) {
        this.field = params.field;
        this.path = params.path || params.field;
        this.unmappedType = params.unmappedType;
        const keyword = params.keyword === undefined ? true : params.keyword;
        this.keyword = unmappedTypeHasKeyword(params.unmappedType) ? keyword : false;
        this.sortable = params.sortable === undefined ? true : params.sortable;
        this.searchable = params.searchable === undefined ? true : params.searchable;
        this.searchValueFn = params.toSearchValue;
    }

    public getSortOptions(order: SortOrder): FieldSortOptions {
        const options = {
            order
        };
        if (!this.unmappedType) {
            return options;
        }
        return {
            ...options,
            unmapped_type: this.unmappedType as any
        };
    }

    public getPath(field: string): string {
        return `${this.getBasePath(field)}${this.keyword ? ".keyword" : ""}`;
    }

    public getBasePath(field: string): string {
        if (this.path === "*") {
            return field;
        }
        return this.path;
    }

    public toSearchValue(params: OpenSearchField.SearchValueParams): any {
        if (this.searchValueFn) {
            return this.searchValueFn(params);
        }
        return params.value;
    }
}
