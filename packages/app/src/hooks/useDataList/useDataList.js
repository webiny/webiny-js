// @flow
import { useState, useEffect, useRef } from "react";
import { useQuery } from "react-apollo";
import useRouter from "use-react-router";
import type { WithDataListParams, SearchParams, WithDataListProps } from "./utils/types";
import { isEqual } from "lodash";
import { prepareLoadListParams, redirectToRouteWithQueryParams } from "./utils";
export type { WithDataListProps, SearchParams, WithDataListParams };

const getQueryOptions = props => {
    let variables = props.variables;
    if (typeof variables === "function") {
        variables = variables(props);
    }

    return {
        variables: {
            ...variables,
            ...prepareLoadListParams(props.location)
        }
    };
};

const useDataList = params => {
    const [multiSelectedItems, multiSelect] = useState([]);
    const queryData = useQuery(params.query, getQueryOptions(params));
    const prevLoadParamsRef = useRef({});

    const { history, location } = useRouter();

    if (!params.getData || !params.getError || !params.getMeta) {
        throw new Error("Missing getData and getError callbacks.");
    }

    const dataListProps: Object = {
        data: params.getData(queryData.data),
        meta: params.getMeta(queryData.data),
        error: params.getError(queryData.data),
        loading: queryData.loading,
        init(): void {
            this.refresh();
        },
        refresh(params): void {
            // Refresh multi select first.
            multiSelect([]);

            if (!params) {
                queryData.refetch(dataListProps.__loadParams);
                return;
            }

            if (history) {
                redirectToRouteWithQueryParams(params, { history, location });
            } else {
                queryData.refetch(params);
            }
        },
        setPerPage(perPage: number): void {
            const preparedParams = {
                ...dataListProps.__loadParams,
                perPage: parseInt(perPage)
            };
            this.refresh(preparedParams);
        },
        setPage(page: number): void {
            const preparedParams = {
                ...dataListProps.__loadParams,
                page: parseInt(page)
            };
            this.refresh(preparedParams);
        },
        setSearch(search: SearchParams | any): void {
            const preparedParams = { ...dataListProps.__loadParams, search };
            this.refresh(preparedParams);
        },
        setWhere(where: Object): void {
            const preparedParams = { ...dataListProps.__loadParams, where };
            this.refresh(preparedParams);
        },
        setSorters(sort: Object): void {
            const preparedParams = { ...dataListProps.__loadParams, sort };
            this.refresh(preparedParams);
        },
        multiSelect(items, value): void {
            if (!Array.isArray(items)) {
                items = [items];
            }

            let returnItems = [...multiSelectedItems];

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
        isMultiSelected(item): boolean {
            if (!Array.isArray(multiSelectedItems)) {
                return false;
            }

            return multiSelectedItems.includes(item);
        },
        isNoneMultiSelected(): boolean {
            return multiSelectedItems.length === 0;
        },
        getMultiSelected(): Array<Object> {
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
