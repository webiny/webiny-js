import * as React from "react";
import { ListProps } from "@webiny/ui/List";
import { MetaProp, SortersProp } from "./types";
declare type Props = {
    children?: Function;
    title?: React.ReactNode;
    data?: Object[];
    refresh?: Function;
    loading?: boolean;
    loader?: React.ReactNode;
    noData?: React.ReactNode;
    meta?: MetaProp;
    setPage?: Function;
    setSorters?: Function;
    setFilters?: Function;
    setPerPage?: Function;
    perPageOptions?: number[];
    sorters?: SortersProp;
    actions?: React.ReactNode;
    multiSelectActions?: React.ReactNode;
    multiSelectAll: (value: boolean) => void;
    isAllMultiSelected: () => boolean;
    isNoneMultiSelected: () => boolean;
    showOptions: {
        [key: string]: any;
    };
};
export declare const DataList: {
    (props: Props): JSX.Element;
    defaultProps: {
        children: any;
        title: any;
        data: any;
        meta: any;
        loading: boolean;
        refresh: any;
        setPage: any;
        setPerPage: any;
        perPageOptions: number[];
        sorters: any;
        setSorters: any;
        actions: any;
        multiSelectAll: () => void;
        isAllMultiSelected: () => boolean;
        isNoneMultiSelected: () => boolean;
        loader: JSX.Element;
        noData: JSX.Element;
        showOptions: {
            refresh: boolean;
            pagination: boolean;
            sorters: boolean;
        };
    };
};
export declare const ScrollList: (props: ListProps & {
    children: React.ReactElement<(props: import("..").ListItemProps) => JSX.Element, string | ((props: any) => React.ReactElement<any, string | any | (new (props: any) => React.Component<any, any, any>)>) | (new (props: any) => React.Component<any, any, any>)>[];
}) => JSX.Element;
export {};
