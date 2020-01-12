declare const useDataList: (params: any) => {
    data: any;
    meta: any;
    error: any;
    loading: boolean;
    init(): void;
    refresh(params?: any): void;
    setPerPage(perPage: number): void;
    setPage(page: number): void;
    setSearch(search: any): void;
    setWhere(where: Object): void;
    setSorters(sort: Object): void;
    multiSelect(items: any, value: any): void;
    isSelected(item: any): boolean;
    select(item: any): void;
    isMultiSelected(item: any): boolean;
    isNoneMultiSelected(): boolean;
    getMultiSelected(): Object[];
    multiSelectAll(value: boolean): void;
    isAllMultiSelected(): boolean;
    __loadParams: {
        [key: string]: any;
    };
};
export { useDataList };
