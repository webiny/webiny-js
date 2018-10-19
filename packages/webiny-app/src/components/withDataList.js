// @flow
import * as React from "react";
import { lifecycle, withProps, withState, setDisplayName } from "recompose";
import { compose, graphql } from "react-apollo";
import _ from "lodash";

import type {
    WithDataListParams,
    SearchParams,
    WithDataListProps
} from "./withDataListUtils/types";

import {
    getPropName,
    prepareLoadListParams,
    redirectToRouteWithQueryParams
} from "./withDataListUtils";

export type { WithDataListProps, SearchParams, WithDataListParams };

export const withDataList = (withDataListParams: Object): Function => {
    const propName = getPropName(withDataListParams);
    return (BaseComponent: typeof React.Component) => {
        return compose(
            setDisplayName("withDataList"),
            withState("multiSelectedItems", "multiSelect", []),
            graphql(withDataListParams.query, {
                name: "queryData",
                options: props => {
                    return {
                        variables: {
                            ...withDataListParams.variables,
                            ...prepareLoadListParams(props.router)
                        }
                    };
                }
            }),
            withProps(props => {
                const returnProps = Object.assign({}, props);
                const { router, queryData } = props;

                const dataListProps: Object = {
                    ...withDataListParams.response(queryData),
                    init(): void {
                        this.refresh();
                    },
                    refresh(params): void {
                        if (!params) {
                            queryData.refetch(dataListProps.__loadParams);
                            return;
                        }

                        if (router) {
                            redirectToRouteWithQueryParams(params, router);
                        } else {
                            queryData.refetch(params);
                        }
                    },
                    setPerPage(perPage: number): void {
                        const preparedParams = {
                            ...dataListProps.__loadParams,
                            perPage
                        };
                        this.refresh(preparedParams);
                    },
                    setPage(page: number): void {
                        const preparedParams = { ...dataListProps.__loadParams, page: page };
                        this.refresh(preparedParams);
                    },
                    setSearch(search: SearchParams): void {
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

                        let multiSelectedItems = [...props.multiSelectedItems];

                        items.forEach(item => {
                            if (value === undefined) {
                                multiSelectedItems.includes(item)
                                    ? multiSelectedItems.splice(multiSelectedItems.indexOf(item), 1)
                                    : multiSelectedItems.push(item);
                            } else {
                                if (value === true) {
                                    !multiSelectedItems.includes(item) &&
                                        multiSelectedItems.push(item);
                                } else {
                                    multiSelectedItems.includes(item) &&
                                        multiSelectedItems.splice(
                                            multiSelectedItems.indexOf(item),
                                            1
                                        );
                                }
                            }
                        });

                        props.multiSelect(multiSelectedItems);
                    },
                    isMultiSelected(item): boolean {
                        if (!Array.isArray(props.multiSelectedItems)) {
                            return false;
                        }

                        return props.multiSelectedItems.includes(item);
                    },
                    isNoneMultiSelected(): boolean {
                        return props.multiSelectedItems.length === 0;
                    },
                    getMultiSelected(): Array<Object> {
                        return props.multiSelectedItems;
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

                        return (
                            Array.isArray(data) && props.multiSelectedItems.length === data.length
                        );
                    },

                    __loadParams: prepareLoadListParams(props.router)
                };

                returnProps[propName] = dataListProps;

                return returnProps;
            }),
            lifecycle({
                componentDidUpdate(prevProps) {
                    const params = {
                        prev: prevProps[propName].__loadParams,
                        next: this.props[propName].__loadParams
                    };

                    !_.isEqual(params.prev, params.next) && this.props[propName].init();
                }
            })
        )(BaseComponent);
    };
};
