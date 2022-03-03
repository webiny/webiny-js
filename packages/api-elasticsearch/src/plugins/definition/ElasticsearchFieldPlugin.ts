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

export abstract class ElasticsearchFieldPlugin extends Plugin {
    public static override readonly type: string = "elasticsearch.fieldDefinition";
    public static readonly ALL: string = "*";

    private readonly _field: string;
    private readonly _path: string;
    private readonly _keyword: boolean;
    private readonly _unmappedType?: string;
    private readonly _sortable: boolean;
    private readonly _searchable: boolean;

    public get field(): string {
        return this._field;
    }

    public get path(): string {
        return this._path;
    }

    public get keyword(): boolean {
        return this._keyword;
    }

    public get unmappedType(): string | undefined {
        return this._unmappedType;
    }

    public get sortable(): boolean {
        return this._sortable;
    }

    public get searchable(): boolean {
        return this._searchable;
    }

    constructor(params: ElasticsearchFieldPluginParams) {
        super();
        this._field = params.field;
        this._path = params.path || params.field;
        this._keyword = params.keyword === undefined ? true : params.keyword;
        this._unmappedType = params.unmappedType;
        if (unmappedTypeHasKeyword(params.unmappedType) === false) {
            this._keyword = false;
        }
        this._sortable = params.sortable === undefined ? true : params.sortable;
        this._searchable = params.searchable === undefined ? true : params.searchable;
    }
    /**
     * The default sort options. Extend in your own plugin if you want to add more options.
     */
    public getSortOptions(order: SortOrder): FieldSortOptions {
        const options = {
            order
        };
        if (!this._unmappedType) {
            return options;
        }
        return {
            ...options,
            unmapped_type: this._unmappedType
        };
    }
    /**
     * The default path generator. Extend in your own plugin if you want to add more options.
     * Field parameter is here because there is a possibility that this is the ALL field plugin, so we need to know which field are we working on.
     */
    public getPath(field: string): string {
        return `${this.getBasePath(field)}${this._keyword ? ".keyword" : ""}`;
    }
    /**
     * @see getPath
     *
     * This is the default base path generator. Basically it replaces ALL with given field name.
     */
    public getBasePath(field: string): string | undefined {
        if (this._path === (this.constructor as any).ALL) {
            return field;
        }
        return this._path;
    }
    /**
     * The default transformer. Just returns the value by default.
     * Override to implement what ever is required.
     */
    public toSearchValue(params: ToSearchValueParams): any {
        return params.value;
    }
}
