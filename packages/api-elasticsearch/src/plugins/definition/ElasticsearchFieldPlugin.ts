import { Plugin } from "@webiny/plugins";
import { FieldSortOptions, SortOrder } from "elastic-ts";

export type UnmappedTypes = "date" | "long" | string;

const keywordLessUnmappedType = ["date", "long"];

const unmappedTypeHasKeyword = (type?: string): boolean => {
    if (!type) {
        return true;
    } else if (keywordLessUnmappedType.includes(type)) {
        return false;
    }
    return true;
};

export interface ToSearchValueParams {
    /**
     * The value to transform.
     */
    value: any;
    /**
     * When using toSearchValue() in our code we send a field.getPath() value here.
     */
    path: string;
    /**
     * When using toSearchValue() in our code we send a field.getBasePath() value here.
     */
    basePath: string;
}
export interface ElasticsearchFieldPluginParams {
    /**
     * Which field is this plugin for.
     */
    field: string;
    /**
     * Some specific path of a field?
     * Example: createdBy is createdBy.id
     */
    path?: string;
    /**
     * Add a .keyword at the end of the field path?
     */
    keyword?: boolean;
    /**
     * Is the field of a specific type, but possibly not mapped?
     * Happens when inserting a date in string format.
     * You need to cast it as date when running the search/sort to work correctly.
     */
    unmappedType?: UnmappedTypes;
    /**
     * Is the field sortable?
     */
    sortable?: boolean;
    /**
     * Is the field searchable?
     */
    searchable?: boolean;
    /**
     * Used to transform the input value for the search.
     */
    toSearchValue?: (params: ToSearchValueParams) => any;
}

export class ElasticsearchFieldPlugin extends Plugin {
    public static override readonly type: string = "elasticsearch.fieldDefinition";
    public static readonly ALL: string = "*";

    public readonly field: string;
    public readonly path: string;
    public readonly keyword: boolean;
    public readonly unmappedType?: string;
    public readonly sortable: boolean;
    public readonly searchable: boolean;

    constructor(params: ElasticsearchFieldPluginParams) {
        super();
        this.field = params.field;
        this.path = params.path || params.field;
        this.keyword = params.keyword === undefined ? true : params.keyword;
        this.unmappedType = params.unmappedType;
        if (unmappedTypeHasKeyword(params.unmappedType) === false) {
            this.keyword = false;
        }
        this.sortable = params.sortable === undefined ? true : params.sortable;
        this.searchable = params.searchable === undefined ? true : params.searchable;
    }
    /**
     * The default sort options. Extend in your own plugin if you want to add more options.
     */
    public getSortOptions(order: SortOrder): FieldSortOptions {
        const options = {
            order
        };
        if (!this.unmappedType) {
            return options;
        }
        return {
            ...options,
            unmapped_type: this.unmappedType
        };
    }
    /**
     * The default path generator. Extend in your own plugin if you want to add more options.
     * Field parameter is here because there is a possibility that this is the ALL field plugin, so we need to know which field are we working on.
     */
    public getPath(field: string): string {
        return `${this.getBasePath(field)}${this.keyword ? ".keyword" : ""}`;
    }
    /**
     * @see getPath
     *
     * This is the default base path generator. Basically it replaces ALL with given field name.
     */
    public getBasePath(field: string): string {
        if (this.path === ElasticsearchFieldPlugin.ALL) {
            return field;
        }
        return this.path;
    }
    /**
     * The default transformer. Just returns the value by default.
     * Override to implement what ever is required.
     */
    public toSearchValue(params: ToSearchValueParams): any {
        return params.value;
    }
}
