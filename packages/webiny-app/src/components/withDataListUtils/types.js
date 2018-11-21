// @flow
export type WithDataListParams = {
    load?: boolean,
    name: string,
    type: string,
    fields: string,
    page?: number,
    perPage?: number,
    sort?: Object,
    where?: Object,
    search?: Object
};

export type SearchParams = {
    query: string,
    operator?: "and" | "or",
    fields?: Array<string>
};

export type WithDataListProps = {
    data: Array<Object>,
    meta: Object,
    init: () => void,
    refresh: (params: ?Object) => void,
    delete: (id: string, options: Object) => void,
    setPerPage: (perPage: number) => void,
    setPage: (page: number) => void,
    setSearch: (search: SearchParams | any) => void,
    setWhere: (where: Object) => void,
    setSorters: (sort: Object) => void,
    multiSelect: (item: Object, value: boolean) => void,
    multiSelectAll: (value: boolean) => void,

    isMultiSelected: (item: Object) => boolean,
    isAllMultiSelected: () => boolean,
    isNoneMultiSelected: () => boolean,
    getMultiSelected: () => Array<Object>,
    __loadParams: WithDataListParams
};
