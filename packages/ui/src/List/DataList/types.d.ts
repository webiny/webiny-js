import * as React from "react";
export declare type MetaProp = {
    from?: number;
    to?: number;
    totalCount?: number;
    totalPages?: number;
    nextPage?: number;
    previousPage?: number;
};
export declare type SortersProp = Array<{
    label: string;
    sorters: {
        [key: string]: number;
    };
}>;
export declare type Props = {
    children?: Function;
    title?: React.ReactNode;
    data?: Object[];
    refresh?: Function;
    loading?: boolean;
    loader?: React.ReactNode;
    meta?: MetaProp;
    setPage?: Function;
    setSorters?: Function;
    setFilters?: Function;
    setPerPage?: Function;
    perPageOptions: number[];
    sorters?: SortersProp;
    multiActions?: any[];
};
