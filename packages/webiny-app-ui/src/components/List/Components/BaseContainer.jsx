import React from "react";
import _ from "lodash";
import invariant from "invariant";
import debug from "debug";
import { app, elementHasFlag } from "webiny-app";
import sortersToString from "./sortersToString";
import Loader from "./../Components/ListContainerLoader";

const log = debug("webiny-app:BaseContainer");

class BaseContainer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            list: [],
            meta: {},
            initialSorters: this.getInitialSorters(props),
            sorters: {},
            filters: {},
            page: props.page,
            perPage: props.perPage,
            search: {
                query: null,
                operator: _.get(props, "search.operator", "or"),
                fields: Array.from(_.get(props, "search.fields", []))
            },
            selectedRows: []
        };

        this.filtersElement = null;
        this.loaderElement = null;
        this.dataElement = null;
        this.paginationElement = null;
        this.multiActionsElement = null;

        [
            "prepareList",
            "tableProps",
            "paginationProps",
            "setSorters",
            "setFilters",
            "setPage",
            "setPerPage",
            "setSearchQuery",
            "getSearchQuery",
            "prepare",
            "onSelect",
            "getContent"
        ].map(m => {
            invariant(this[m], `Method ${m} does not exist!`);
            this[m] = this[m].bind(this);
        });
    }

    componentWillMount() {
        this.prepare(this.props);
    }

    componentWillReceiveProps(props) {
        this.prepare(props);
    }

    getInitialSorters(props) {
        const sorters = {};
        const sortValues = [_.get(props, "sort", ""), _.get(props.query, "_sort", "")];

        sortValues
            .join(",")
            .split(",")
            .map(sorter => {
                if (sorter === "") {
                    return;
                }
                if (sorter.startsWith("-")) {
                    sorters[_.trimStart(sorter, "-")] = -1;
                } else {
                    sorters[sorter] = 1;
                }
            });

        return sorters;
    }

    prepare(props) {
        const state = props.connectToRouter
            ? this.prepareUsingRouter(props)
            : this.prepareNotUsingRouter();

        this.setState(state);
    }

    prepareUsingRouter(props) {
        const state = {
            sorters: {},
            filters: {}
        };
        const params = app.router.getQuery();
        const urlSort = params._sort || "";
        urlSort.split(",").map(sorter => {
            if (sorter === "") {
                return;
            }
            if (sorter.startsWith("-")) {
                state.sorters[_.trimStart(sorter, "-")] = -1;
            } else {
                state.sorters[sorter] = 1;
            }
        });

        // Get limit and page
        state.page = parseInt(params._page || props.page || 1);
        state.perPage = params._perPage || props.perPage || 10;
        if (params._searchQuery && params._searchQuery !== "") {
            state.search = { ...this.state.search, query: params._searchQuery };
        } else {
            state.search = { ...this.state.search, query: null };
        }

        // Get filters
        _.each(params, (value, name) => {
            if (!name.startsWith("_")) {
                state.filters[name] = value;
            }
        });

        return state;
    }

    prepareNotUsingRouter() {
        return {
            sorters: {},
            filters: {}
        };
    }

    setSorters(sorters) {
        if (this.props.connectToRouter) {
            this.goToRoute({ _sort: sortersToString(sorters), _page: 1 });
        } else {
            this.setState({ page: 1, sorters });
        }

        return this;
    }

    setFilters(filters) {
        if (this.props.connectToRouter) {
            // Need to build a new object with null values to unset filters from URL
            if (_.isEmpty(filters) && _.keys(this.state.filters)) {
                filters = _.mapValues(this.state.filters, () => null);
            }

            filters._page = 1;
            this.goToRoute(filters);
        } else {
            this.setState({ page: 1, filters });
        }

        return this;
    }

    setPage(page) {
        if (this.props.connectToRouter) {
            this.goToRoute({ _page: page });
        } else {
            this.setState({ page });
        }

        return this;
    }

    setPerPage(perPage) {
        if (this.props.connectToRouter) {
            this.goToRoute({ _perPage: perPage, _page: 1 });
        } else {
            this.setState({ page: 1, perPage });
        }

        return this;
    }

    setSearchQuery(query) {
        if (this.props.connectToRouter) {
            this.goToRoute({ _searchQuery: query, _page: 1 });
        } else {
            this.setState(state => {
                return _.merge({}, state, { page: 1, search: { query } });
            });
        }

        return this;
    }

    goToRoute(params) {
        const routeParams = _.merge({}, app.router.getQuery(), params);
        app.router.goToRoute("current", routeParams);
    }

    getSearchQuery() {
        return _.get(this.state, "search.query");
    }

    getFilters() {
        return this.state.filters;
    }

    onSelect(selectedRows) {
        this.setState({ selectedRows });
    }

    tableProps(tableProps) {
        _.assign(tableProps, {
            data: _.cloneDeep(this.state.list),
            sorters: _.cloneDeep(this.state.sorters),
            onSort: this.setSorters,
            selectedRows: [...this.state.selectedRows]
        });

        return tableProps;
    }

    paginationProps(paginationProps) {
        _.assign(paginationProps, {
            onPageChange: this.setPage,
            onPerPageChange: this.setPerPage,
            currentPage: this.state.page,
            perPage: this.state.perPage,
            count: _.get(this.state.list, "length", 0),
            totalCount: _.get(this.state.meta, "totalCount", 0),
            totalPages: _.get(this.state.meta, "totalPages", 0)
        });

        return paginationProps;
    }

    multiActionsProps(multiActionsProps) {
        _.assign(multiActionsProps, {
            data: this.state.selectedRows
        });

        return multiActionsProps;
    }

    /**
     * @private
     * @param children
     * @param listProps
     */
    prepareList(children, listProps) {
        if (typeof children !== "object" || children === null) {
            return;
        }

        React.Children.map(
            children,
            child => {
                if (elementHasFlag(child, "listFiltersComponent")) {
                    // Need to omit fields that are not actual filters
                    this.filtersElement = React.cloneElement(child, {
                        filters: this.state.filters,
                        onFilter: this.setFilters
                    });
                }

                const props = _.omit(child.props, ["children", "key", "ref"]);
                if (elementHasFlag(child, "listDataComponent")) {
                    this.dataElement = React.cloneElement(
                        child,
                        { ...this.tableProps(props), ...listProps },
                        child.props.children
                    );
                }

                if (elementHasFlag(child, "listPaginationComponent")) {
                    this.paginationElement = React.cloneElement(
                        child,
                        { ...this.paginationProps(props), ...listProps },
                        child.props.children
                    );
                }

                if (elementHasFlag(child, "listLoaderComponent")) {
                    this.loaderElement = child;
                }

                if (elementHasFlag(child, "listMultiActionsComponent")) {
                    this.multiActionsElement = React.cloneElement(
                        child,
                        { ...this.multiActionsProps(props), ...listProps },
                        child.props.children
                    );
                }
            },
            this
        );

        if (!this.loaderElement) {
            this.loaderElement = React.createElement(Loader, listProps);
        } else {
            this.loaderElement = React.cloneElement(this.loaderElement, listProps);
        }

        // If MultiActions are present, pass an onSelect callback to Table which will tell Table to allow selection
        // and execute onSelect callback when selection is changed
        if (this.multiActionsElement) {
            this.dataElement = React.cloneElement(this.dataElement, { onSelect: this.onSelect });
        }

        return {
            filtersElement: this.filtersElement,
            dataElement: this.dataElement,
            paginationElement: this.paginationElement,
            multiActionsElement: this.multiActionsElement,
            loaderElement: this.loaderElement
        };
    }

    /**
     * Get ApiContainer content
     * @returns {*}
     */
    getContent(children) {
        return React.Children.toArray(children);
    }

    render() {
        const { children, props } = this.props;
        return React.cloneElement(children, {
            ...props,
            ...this.state,
            setState: (...args) => this.setState(...args),
            prepare: props => this.prepare(props),
            prepareList: this.prepareList.bind(this),
            getContent: children => this.getContent(children)
        });
    }
}

BaseContainer.defaultProps = {
    connectToRouter: false,
    trackLastUsedParameters: true,
    page: 1,
    perPage: 10
};

export default BaseContainer;
