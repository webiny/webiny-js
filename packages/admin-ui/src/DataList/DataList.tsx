import React, { useMemo } from "react";
import isEmpty from "lodash/isEmpty.js";
import { Heading } from "~/Heading/index.js";
import {
    Filters,
    Loader,
    MultiSelectActions,
    MultiSelectAll,
    NoData,
    Pagination,
    RefreshButton,
    Sorters
} from "~/DataList/components/index.js";
import { DataListModal } from "~/DataList/DataListModal.js";
import type { DataListProps } from "~/DataList/types.js";

const defaultDataListProps = {
    children: null,
    title: null,
    data: null,
    meta: null,
    loading: false,
    refresh: () => {
        return void 0;
    },
    setPage: null,
    setPerPage: null,
    perPageOptions: [10, 25, 50],
    filters: null,
    sorters: null,
    setSorters: null,
    actions: null,
    multiSelectAll: () => {},
    isAllMultiSelected: () => false,
    isNoneMultiSelected: () => false,
    loader: <Loader />,
    noData: <NoData />,
    showOptions: {
        refresh: true,
        pagination: true,
        sorters: true,
        filters: true
    }
};

export const DataList = <TData,>(propsInput: DataListProps<TData>) => {
    let render: React.ReactNode | null;

    const props = useMemo(() => {
        return {
            ...defaultDataListProps,
            ...propsInput
        };
    }, [propsInput]);

    if (props.loading) {
        render = props.loader;
    } else if (isEmpty(props.data)) {
        render = props.noData;
    } else {
        const ch = props.children;
        render = typeof ch === "function" ? ch(props) : null;
    }

    const showOptions = props.showOptions || {};

    return (
        <div data-testid={"ui.list.data-list"}>
            <div className={"pt-md pb-sm pl-lg pr-md"}>
                {(props.title || props.actions) && (
                    <div className={"flex justify-between items-center mb-xl"}>
                        <Heading className={"text-neutral-primary"} level={4}>
                            {props.title}
                        </Heading>
                    </div>
                )}

                {Object.keys(showOptions).length > 0 && (
                    <div
                        className={"flex items-center justify-space-between gap-sm"}
                    >
                        <div className={"flex-1"}>
                            {props.search ? React.cloneElement(props.search, props) : null}
                        </div>
                        <div
                            className={
                                "flex items-center justify-space-between gap-xs"
                            }
                        >
                            <MultiSelectAll {...props} />
                            <MultiSelectActions {...props} />
                            {showOptions.refresh && <RefreshButton {...props} />}
                            {showOptions.pagination && <Pagination {...props} />}
                            {showOptions.sorters && <Sorters {...props} />}
                            {showOptions.filters && <Filters {...props} />}
                            {props.modalOverlayAction && props.modalOverlay && (
                                <DataListModal
                                    trigger={props.modalOverlayAction}
                                    content={props.modalOverlay}
                                />
                            )}
                            {props.actions}
                        </div>
                    </div>
                )}
            </div>

            <div
                style={{ maxHeight: "calc(100vh - 165px)" }}
                className={
                    "relative overflow-auto border-t-sm border-t-neutral-dimmed webiny-data-list__content"
                }
            >
                {props.subHeader}
                {render}
            </div>
        </div>
    );
};
