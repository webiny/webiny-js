import * as React from "react";

export type PaginationProp = {
    // Triggered when a page is about to be changed.
    setPage?: (page: number) => void;

    // Triggered when previous page is requested.
    setPreviousPage?: () => void;

    // Triggered when next page is requested.
    setNextPage?: () => void;

    // Triggered internally when in need to determine if there is a next page and apply UI changes accordingly.
    hasNextPage?: boolean;

    // Triggered internally when in need to determine if there is a previous page and apply UI changes accordingly.
    hasPreviousPage?: boolean;

    // Triggered when number of entries per page has been changed.
    setPerPage?: (amount: number) => void;

    // By default, users can choose from 10, 25 or 50 entries per page.
    perPageOptions?: number[];
};

export type SortersProp = Array<{ label: string; value: any }>;

export type Props = {
    // Pass a function to take full control of list render.
    children?: Function;

    // A title of paginated list.
    title?: React.ReactNode;

    // FormData that needs to be shown in the list.
    data?: Object[];

    // A callback that must refresh current view by repeating the previous query.
    refresh?: Function;

    // If true, Loader component will be shown, disallowing any interaction.
    loading?: boolean;

    // Provide a custom loader. Shown while the content is being loaded.
    loader?: React.ReactNode;

    // Provide all pagination data, options and callbacks here.
    pagination?: PaginationProp;

    // Triggered once the page has been selected.
    setPage?: Function;

    // Triggered once a sorter has been selected.
    setSorters?: Function;

    // Triggered once selected filters are submitted.
    setFilters?: Function;

    // Provide all sorters options and callbacks here.
    sorters?: SortersProp;

    multiActions?: any[]; // TODO: define
};
