import { Plugin } from "@webiny/plugins";
import { FieldSortOptions, SortOrder } from "elastic-ts";
import { ContextInterface } from "@webiny/handler/types";

type UnmappedTypes = "date" | "long" | string;
interface ToSearchValueParams {
    context: ContextInterface;
    value: any;
    path: string;
}
interface ElasticsearchFieldPluginParams {
    /**
     * Which entity is this plugin for.
     */
    entity: string;
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
    public static readonly type = "elasticsearch.fieldDefinition";

    private readonly _entity: string;
    private readonly _field: string;
    private readonly _path: string;
    private readonly _keyword: boolean;
    private readonly _unmappedType: string;
    private readonly _sortable: boolean;
    private readonly _searchable: boolean;

    public get entity(): string {
        return this._entity;
    }

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
        this._entity = params.entity;
        this._field = params.field;
        this._path = params.path || params.field;
        this._keyword = params.keyword === undefined ? true : params.keyword;
        this._unmappedType = params.unmappedType;
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
     */
    public getPath(): string {
        return `${this.path}${this.keyword ? ".keyword" : ""}`;
    }
    /**
     * The default transformer. Just returns the value by default.
     * Override to implement what ever is required.
     */
    public toSearchValue(params: ToSearchValueParams): any {
        return params.value;
    }
}
