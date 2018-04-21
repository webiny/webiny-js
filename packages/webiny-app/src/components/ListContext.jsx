import React from "react";
import _ from "lodash";
import { app } from "webiny-app";

function sortToString(sort) {
    const urlSort = [];
    _.each(sort, (value, field) => {
        if (value === 1) {
            urlSort.push(field);
        } else {
            urlSort.push("-" + field);
        }
    });

    return urlSort.length ? urlSort.join(",") : null;
}

function goToRoute(params) {
    const routeParams = _.merge({}, app.router.getQuery(), params);
    app.router.goToRoute("current", routeParams);
}

class ListContext extends React.Component {
    constructor(props) {
        super();
        this.state = {
            sort: {},
            filter: {},
            page: props.page || 1,
            perPage: props.perPage || 10,
            search: {
                query: null,
                operator: _.get(props, "search.operator", "or"),
                fields: Array.from(_.get(props, "search.fields", []))
            }
        };
    }

    getRouterContext(props) {
        const listProps = {
            sort: {},
            filter: {},
            setSort(sort) {
                goToRoute({ _sort: sortToString(sort), _page: 1 });
            },
            setFilter(data) {
                let { search, ...filter } = data;
                // Need to build a new object with null values to unset filter from URL
                if (_.isEmpty(filter) && _.keys(this.state.filter)) {
                    filter = _.mapValues(this.state.filter, () => null);
                }

                filter._page = 1;
                filter._searchQuery = _.get(search, "query");
                goToRoute(filter);
            },
            setPage(page) {
                goToRoute({ _page: page });
            },
            setPerPage(perPage) {
                goToRoute({ _perPage: perPage, _page: 1 });
            },
            setSearchQuery(query) {
                goToRoute({ _searchQuery: query, _page: 1 });
            }
        };

        const params = app.router.getQuery();
        const urlSort = params._sort || "";
        urlSort.split(",").map(sorter => {
            if (sorter === "") {
                return;
            }
            if (sorter.startsWith("-")) {
                listProps.sort[_.trimStart(sorter, "-")] = -1;
            } else {
                listProps.sort[sorter] = 1;
            }
        });

        // Get limit and page
        listProps.page = parseInt(params._page || props.page || 1);
        listProps.perPage = params._perPage || props.perPage || 10;

        // Get search
        listProps.search = {
            query: params._searchQuery && params._searchQuery !== "" ? params._searchQuery : null,
            fields: _.get(props, "search.fields", ["name"]),
            operator: _.get(props, "search.operator", "or")
        };

        // Get filter
        _.each(params, (value, name) => {
            if (!name.startsWith("_")) {
                listProps.filter[name] = value;
            }
        });

        return listProps;
    }

    getStandaloneContext() {
        const $this = this;
        return {
            sort: this.state.sort,
            filter: this.state.filter,
            page: this.state.page,
            perPage: this.state.perPage,
            search: this.state.search,
            setSort(sort) {
                $this.setState({ page: 1, sort });
            },
            setFilter(data) {
                const { search, ...filter } = data;
                $this.setState({ page: 1, filter, search });
            },
            setPage(page) {
                $this.setState({ page });
            },
            setPerPage(perPage) {
                $this.setState({ page: 1, perPage });
            },
            setSearchQuery(query) {
                $this.setState(state => {
                    return _.merge({}, state, { page: 1, search: { query } });
                });
            }
        };
    }

    render() {
        const { children, withRouter, ...props } = this.props;
        const listProps = {
            ...props,
            ...(withRouter ? this.getRouterContext(props) : this.getStandaloneContext(props))
        };

        return React.cloneElement(children, listProps);
    }
}

export default ListContext;
