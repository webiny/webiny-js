import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "react-apollo";
import useRouter from "use-react-router";
import { get, isEqual } from "lodash";
import { prepareLoadListParams, redirectToRouteWithQueryParams } from "./utils";
import { getData, getError, getMeta } from "./functions";

import { DocumentNode } from "graphql";

export type UseDataListParams = {
    useRouter?: boolean;
    variables?: ((params: UseDataListParams) => any) | object;
    query: DocumentNode;
    getData?: (data: any) => any;
    getMeta?: (data: any) => any;
    getError?: (data: any) => any;
};

export type ReturnProps = {
    __loadParams: any;
    refresh: (params?: any) => void;
    data: any[];
    meta: any;
    error: any;
    loading: boolean;
    isSelected: (item: any) => boolean;
    select: (item: any) => void;
    isMultiSelected: (item: any) => boolean;
    isNoneMultiSelected: () => boolean;
    isAllMultiSelected: () => boolean;
    multiSelectAll: (value: boolean) => void;
    getMultiSelected: () => any[];
    setSearch: (search: any) => void;
    setWhere: (where: any) => void;
    setSorters: (sort: any) => void;
    setPerPage: (perPage: number) => void;
    setPage: (page: number) => void;
    multiSelect: (items: string | string[], value?: boolean) => void;
    init: () => void;
};

const useDataList = (params: UseDataListParams) => {
    const [multiSelectedItems, multiSelect] = useState([]);

    let history = null;
    let location = null;
    const routerHook = useRouter();
    // TODO: const router = ....
    if (params.useRouter !== false) {
        history = routerHook.history;
        location = routerHook.location;
    }

    const getQueryOptions = useCallback(() => {
        let variables = params.variables;
        if (typeof variables === "function") {
            variables = variables(params);
        }

        return {
            variables: {
                ...variables,
                ...prepareLoadListParams(location)
            }
        };
    }, []);

    const queryData = useQuery(params.query, getQueryOptions());
    const prevLoadParamsRef = useRef({});

    const dataListProps: ReturnProps = {
        data: get(queryData, "list.getData", getData)(queryData.data),
        meta: get(queryData, "list.getMeta", getMeta)(queryData.data),
        error: get(queryData, "list.getError", getError)(queryData.data),

        loading: queryData.loading,
        init() {
            this.refresh();
        },
        refresh(params = null): void {
            // Refresh multi select first.
            multiSelect([]);

            if (!params) {
                queryData.refetch(dataListProps.__loadParams);
                return;
            }

            if (history) {
                redirectToRouteWithQueryParams(params, { history, location });
                return;
            }

            queryData.refetch(params);
        },
        setPerPage(perPage: number): void {
            const preparedParams = {
                ...dataListProps.__loadParams,
                perPage: parseInt("" + perPage)
            };
            this.refresh(preparedParams);
        },
        setPage(page: number): void {
            const preparedParams = {
                ...dataListProps.__loadParams,
                page: parseInt("" + page)
            };
            this.refresh(preparedParams);
        },
        setSearch(search): void {
            const preparedParams = { ...dataListProps.__loadParams, search };
            this.refresh(preparedParams);
        },
        setWhere(where): void {
            const preparedParams = { ...dataListProps.__loadParams, where };
            this.refresh(preparedParams);
        },
        setSorters(sort): void {
            const preparedParams = { ...dataListProps.__loadParams, sort };
            this.refresh(preparedParams);
        },
        multiSelect(items, value): void {
            if (!Array.isArray(items)) {
                items = [items];
            }

            const returnItems = [...multiSelectedItems];

            items.forEach(item => {
                if (value === undefined) {
                    returnItems.includes(item)
                        ? returnItems.splice(returnItems.indexOf(item), 1)
                        : returnItems.push(item);
                } else {
                    if (value === true) {
                        !returnItems.includes(item) && returnItems.push(item);
                    } else {
                        returnItems.includes(item) &&
                            returnItems.splice(returnItems.indexOf(item), 1);
                    }
                }
            });

            multiSelect(returnItems);
        },
        isSelected(item) {
            const query = new URLSearchParams(location.search);
            return query.get("id") === item.id;
        },
        select(item) {
            const query = new URLSearchParams(location.search);
            query.set("id", item.id);
            history.push({ search: query.toString() });
        },
        isMultiSelected(item) {
            if (!Array.isArray(multiSelectedItems)) {
                return false;
            }

            return multiSelectedItems.includes(item);
        },
        isNoneMultiSelected() {
            return multiSelectedItems.length === 0;
        },
        getMultiSelected() {
            return multiSelectedItems;
        },
        multiSelectAll(value: boolean): void {
            const { data } = dataListProps;
            if (Array.isArray(data)) {
                dataListProps.multiSelect(data, value);
            } else {
                dataListProps.multiSelect([], value);
            }
        },
        isAllMultiSelected(): boolean {
            const { data } = dataListProps;

            return Array.isArray(data) && multiSelectedItems.length === data.length;
        },

        __loadParams: prepareLoadListParams(location)
    };

    useEffect(() => {
        const params = {
            prev: prevLoadParamsRef.current,
            current: dataListProps.__loadParams
        };

        if (!isEqual(params.prev, params.current)) {
            dataListProps.init();
        }

        prevLoadParamsRef.current = params.current;
    });

    return dataListProps;
};

export { useDataList };
