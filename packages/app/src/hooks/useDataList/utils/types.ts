export type UseDataListParams = {
    load?: boolean;
    name: string;
    type: string;
    fields: string;
    limit?: number;
    sort?: {
        [key: string]: string;
    };
    where?: {
        [key: string]: any;
    };
    search?: {
        [key: string]: any;
    };
};

export type SearchParams = {
    query: string;
    operator?: "and" | "or";
    fields?: Array<string>;
};

export type UseDataListProps = {
    data: Record<string, any>[];
    meta: Record<string, any>;
    init: () => void;
    refresh: (params?: Record<string, any>) => void;
    delete: (id: string, options: Record<string, any>) => void;
    setPerPage: (perPage: number) => void;
    setPage: (page: number) => void;
    setSearch: (search: SearchParams | any) => void;
    setWhere: (where: Record<string, any>) => void;
    setSorters: (sort: Record<string, any>) => void;
    multiSelect: (item: Record<string, any>, value: boolean) => void;
    multiSelectAll: (value: boolean) => void;

    isMultiSelected: (item: Record<string, any>) => boolean;
    isAllMultiSelected: () => boolean;
    isNoneMultiSelected: () => boolean;
    getMultiSelected: () => Record<string, any>[];
    __loadParams: UseDataListParams;
};
