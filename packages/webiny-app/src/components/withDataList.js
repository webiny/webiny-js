// @flow
import * as React from "react";
import { connect } from "react-redux";
import { compose, lifecycle, withProps } from "recompose";
import { graphql } from "react-apollo";
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

// For returning the same instance in connect function (returnProps).
const emptyArray = [];
const emptyObject = {};

export const withDataList = (withDataListParams: Object): Function => {
    const propName = getPropName(withDataListParams);

    return (BaseComponent: typeof React.Component) => {
        return compose(
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
                const propName = withDataListParams.name;
                const returnProps = Object.assign({}, props);
                const { router, queryData } = props;

                const dataListProps: Object = {
                    data: queryData,
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
                    multiSelect(item, value): void {
                        // TODO:
                        //dispatchProps.multiSelect({ ...withDataListParams, item, value });
                    },
                    multiSelectAll(value: ?Object): void {
                        // TODO:
                        /*const { data } = returnProps[propName];
                        if (Array.isArray(data)) {
                            dispatchProps.multiSelect({
                                ...withDataListParams,
                                item: data,
                                value
                            });
                        } else {
                            dispatchProps.multiSelect({
                                ...withDataListParams,
                                item: [],
                                value
                            });
                        }*/
                    },
                    isMultiSelected(item): boolean {
                        if (!Array.isArray(returnProps[propName].multiSelectedItems)) {
                            return false;
                        }

                        return returnProps[propName].multiSelectedItems.includes(item);
                    },
                    isAllMultiSelected(): boolean {
                        return (
                            returnProps[propName].getMultiSelected().length ===
                            returnProps[propName].data.length
                        );
                    },
                    isNoneMultiSelected(): boolean {
                        return returnProps[propName].getMultiSelected().length === 0;
                    },
                    getMultiSelected(): Array<Object> {
                        return returnProps[propName].multiSelectedItems || [];
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
