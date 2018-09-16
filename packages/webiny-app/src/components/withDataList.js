// @flow
import * as React from "react";
import { connect } from "react-redux";
import { compose, lifecycle } from "recompose";
import { loadDataList, typeDelete, multiSelect } from "./../actions";
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

export const withDataList = (withDataListParams: WithDataListParams): Function => {
    const propName = getPropName(withDataListParams);

    return (BaseComponent: typeof React.Component) => {
        return compose(
            connect(
                state => ({
                    dataListState: _.get(state, `lists.${withDataListParams.name}`)
                }),
                { loadList: loadDataList, typeDelete, multiSelect },
                (stateProps, dispatchProps, ownProps) => {
                    const returnProps = Object.assign({}, ownProps);
                    const { router } = ownProps;

                    const { dataListState } = stateProps;

                    const dataListProps: WithDataListProps = {
                        ...dataListState,
                        meta: _.get(dataListState, "data.meta", emptyObject),
                        data: _.get(dataListState, "data.data", emptyArray),
                        init(): void {
                            if (dataListProps.__loadParams.load === false) {
                                return;
                            }
                            this.refresh();
                        },
                        refresh(params): void {
                            if (!params) {
                                dispatchProps.loadList(dataListProps.__loadParams);
                                return;
                            }

                            if (router) {
                                redirectToRouteWithQueryParams(params, router);
                            } else {
                                dispatchProps.loadList(params);
                            }
                        },
                        delete(id, options = {}): void {
                            const { type, fields, name } = withDataListParams;
                            dispatchProps.typeDelete({
                                type,
                                fields,
                                name,
                                id,
                                onSuccess: options.onSuccess || dataListProps.refresh
                            });
                        },
                        setPerPage(perPage: number): void {
                            const preparedParams = {
                                ...dataListProps.__loadParams,
                                perPage: perPage
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
                            dispatchProps.multiSelect({ ...withDataListParams, item, value });
                        },
                        multiSelectAll(value: ?Object): void {
                            const { data } = returnProps[propName];
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
                            }
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
                        __loadParams: prepareLoadListParams(withDataListParams, ownProps.router)
                    };

                    returnProps[propName] = dataListProps;

                    return returnProps;
                },
                {
                    areStatePropsEqual: (next, previous) => {
                        return _.isEqual(previous, next);
                    }
                }
            ),
            lifecycle({
                componentDidMount() {
                    this.props[propName].init();
                },
                componentDidUpdate(prevProps) {
                    const params = {
                        prev: prevProps[propName].__loadParams,
                        next: this.props[propName].__loadParams
                    };

                    !_.isEqual(params.prev, params.next) && console.log(params);
                    !_.isEqual(params.prev, params.next) && this.props[propName].init();
                }
            })
        )(BaseComponent);
    };
};
