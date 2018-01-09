import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import Filters from './Filters';
import Table from './Table/Table';
import MultiActions from './MultiActions';
import Pagination from './Pagination';
import Loader from './../Components/ListContainerLoader';

class BaseContainer extends Webiny.Ui.Component {

    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            list: [],
            meta: {},
            initialSorters: this.getInitialSorters(props),
            sorters: {},
            filters: {},
            page: props.page,
            perPage: props.perPage,
            searchQuery: null,
            searchOperator: props.searchOperator || 'or',
            searchFields: props.searchFields ? props.searchFields.replace(/\s/g, '') : null,
            selectedRows: []
        };

        this.filtersElement = null;
        this.loaderElement = null;
        this.tableElement = null;
        this.paginationElement = null;
        this.multiActionsElement = null;

        this.bindMethods(
            'prepareList',
            'tableProps',
            'paginationProps',
            'setSorters',
            'setFilters',
            'setPage',
            'setPerPage',
            'setSearchQuery',
            'getSearchQuery',
            'loadData',
            'prepare',
            'recordUpdate',
            'recordDelete',
            'onSelect',
            'getContent',
            'registerElement'
        );
    }

    componentWillMount() {
        super.componentWillMount();
        if (this.props.connectToRouter && this.props.trackLastUsedParameters) {
            if (Object.keys(Webiny.Router.getQueryParams()).length === 0) {
                const value = Webiny.LocalStorage.get('webiny.list.' + window.location.pathname);
                if (value) {
                    Webiny.Router.goToRoute('current', value);
                }
            }
        }
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
    }

    getInitialSorters(props) {
        const sorters = {};
        const sortValues = [
            _.get(props, 'sort', ''),
            _.get(props.query, '_sort', '')
        ];

        sortValues.join(',').split(',').map(sorter => {
            if (sorter === '') {
                return;
            }
            if (sorter.startsWith('-')) {
                sorters[_.trimStart(sorter, '-')] = -1;
            } else {
                sorters[sorter] = 1;
            }
        });

        return Webiny.Router.sortersToString(sorters);
    }

    /**
     * LOADING METHODS
     */
    showLoading() {
        this.setState({loading: true});
    }

    hideLoading() {
        this.setState({loading: false});
    }

    isLoading() {
        return this.state.loading;
    }

    loadData() {
        throw new Error('Implement loadData method in your list container class!');
    }

    prepare(props) {
        return new Promise(resolve => {
            const state = props.connectToRouter ? this.prepareUsingRouter(props) : this.prepareNotUsingRouter(props);

            this.setState(state, resolve);
        });
    }

    prepareUsingRouter(props) {
        const state = {
            sorters: {},
            filters: {}
        };
        const params = Webiny.Router.getQueryParams();
        const urlSort = params._sort || '';
        urlSort.split(',').map(sorter => {
            if (sorter === '') {
                return;
            }
            if (sorter.startsWith('-')) {
                state.sorters[_.trimStart(sorter, '-')] = -1;
            } else {
                state.sorters[sorter] = 1;
            }
        });

        // Get limit and page
        state.page = parseInt(params._page || props.page || 1);
        state.perPage = params._perPage || props.perPage || 10;
        state.searchQuery = params._searchQuery || null;

        // Get filters
        _.each(params, (value, name) => {
            if (!name.startsWith('_')) {
                state.filters[name] = value;
            }
        });

        // Add _searchQuery to filters even though it starts with '_' - it's a special system parameter and is in fact a filter
        state.filters._searchQuery = state.searchQuery;

        return state;
    }

    prepareNotUsingRouter(props) {
        return {
            sorters: {},
            filters: {},
        };
    }

    setSorters(sorters) {
        if (this.props.connectToRouter) {
            this.goToRoute({_sort: Webiny.Router.sortersToString(sorters), _page: 1});
        } else {
            this.setState({page: 1, sorters}, this.loadData);
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
            this.setState({page: 1, filters}, this.loadData);
        }

        return this;
    }

    setPage(page) {
        if (this.props.connectToRouter) {
            this.goToRoute({_page: page});
        } else {
            this.setState({page}, this.loadData);
        }

        return this;
    }

    setPerPage(perPage) {
        if (this.props.connectToRouter) {
            this.goToRoute({_perPage: perPage, _page: 1});
        } else {
            this.setState({page: 1, perPage}, this.loadData);
        }

        return this;
    }

    setSearchQuery(query) {
        if (this.props.connectToRouter) {
            this.goToRoute({_searchQuery: query, _page: 1});
        } else {
            this.setState({page: 1, searchQuery: query}, this.loadData);
        }

        return this;
    }

    goToRoute(params) {
        const routeParams = _.merge({}, Webiny.Router.getParams(), params);
        if (this.props.connectToRouter && this.props.trackLastUsedParameters) {
            Webiny.LocalStorage.set('webiny.list.' + window.location.pathname, routeParams);
        }
        Webiny.Router.goToRoute('current', routeParams);
    }

    getSearchQuery() {
        return this.state.searchQuery;
    }

    getFilters() {
        return this.state.filters;
    }

    /* eslint-disable */
    recordUpdate(id, attributes) {
        throw new Error('Implement recordUpdate method in your list container class!');
    }

    recordDelete(id, autoRefresh = true) {
        throw new Error('Implement recordDelete method in your list container class!');
    }

    /* eslint-enable */

    onSelect(data) {
        this.setState({selectedRows: data});
    }

    getContainerActions() {
        return {
            reload: this.loadData,
            update: this.recordUpdate,
            delete: this.recordDelete
        };
    }

    tableProps(tableProps) {
        // Pass relevant props from BaseContainer to Table
        _.each(this.props, (value, name) => {
            if (name.startsWith('field') && name !== 'fields' || name.startsWith('action')) {
                tableProps[name] = value;
            }
        });

        _.assign(tableProps, {
            data: _.clone(this.state.list),
            sorters: this.state.sorters,
            onSort: this.setSorters,
            actions: this.getContainerActions(),
            selectedRows: this.state.selectedRows,
            showEmpty: !this.isLoading()
        });

        return tableProps;
    }

    paginationProps(paginationProps) {
        _.assign(paginationProps, {
            onPageChange: this.setPage,
            onPerPageChange: this.setPerPage,
            currentPage: this.state.page,
            perPage: this.state.perPage,
            count: _.get(this.state.list, 'length', 0),
            totalCount: _.get(this.state.meta, 'totalCount', 0),
            totalPages: _.get(this.state.meta, 'totalPages', 0)
        });

        return paginationProps;
    }

    multiActionsProps(multiActionsProps) {
        _.assign(multiActionsProps, {
            data: this.state.selectedRows,
            actions: this.getContainerActions()
        });

        return multiActionsProps;
    }

    /**
     * @private
     * @param children
     */
    prepareList(children) {
        if (typeof children !== 'object' || children === null) {
            return;
        }

        React.Children.map(children, child => {
            if (Webiny.isElementOfType(child, Filters)) {
                // Need to omit fields that are not actual filters
                this.filtersElement = React.cloneElement(child, {
                    filters: this.state.filters,
                    onFilter: this.setFilters
                });
            }

            const props = _.omit(child.props, ['children', 'key', 'ref']);
            if (Webiny.isElementOfType(child, Table)) {
                this.tableElement = React.cloneElement(child, this.tableProps(props), child.props.children);
            }

            if (Webiny.isElementOfType(child, Pagination)) {
                this.paginationElement = React.cloneElement(child, this.paginationProps(props), child.props.children);
            }

            if (Webiny.isElementOfType(child, Loader)) {
                this.loaderElement = React.cloneElement(child, {show: this.isLoading()}, child.props.children);
            }

            if (Webiny.isElementOfType(child, MultiActions)) {
                this.multiActionsElement = React.cloneElement(child, this.multiActionsProps(props), child.props.children);
            }
        }, this);

        // If MultiActions are present, pass an onSelect callback to Table which will tell Table to allow selection
        // and execute onSelect callback when selection is changed
        if (this.multiActionsElement) {
            this.tableElement = React.cloneElement(this.tableElement, {onSelect: this.onSelect});
        }
    }

    /**
     * @private
     * @param element
     * @returns {*}
     */
    replacePlaceholders(element) {
        if (typeof element !== 'object' || element === null) {
            return element;
        }

        if (element.type === 'filters' && this.filtersElement) {
            return this.filtersElement;
        }

        if (element.type === 'table') {
            return this.tableElement;
        }

        if (element.type === 'pagination') {
            return this.paginationElement;
        }

        if (element.type === 'loader') {
            return this.loaderElement ? this.loaderElement : React.createElement(Loader, {show: this.isLoading()});
        }

        if (element.type === 'multi-actions') {
            return this.multiActionsElement;
        }

        if (element.props && element.props.children) {
            return React.cloneElement(element, _.omit(element.props, ['key', 'ref']), React.Children.map(element.props.children, item => {
                return this.replacePlaceholders(item);
            }));
        }

        return element;
    }

    /**
     * Get ApiContainer content
     * @returns {*}
     */
    getContent() {
        const children = this.props.children;
        if (_.isFunction(children)) {
            const params = {
                list: this.state.list,
                meta: this.state.meta,
                $this: this
            };

            const content = children.call(this, params);

            // NOTE: The following hacky "if" is needed because React does not yet support returning of multiple elements.
            // And since BaseContainer only parses first level of children, if you return some kind of a wrapper while using a layout
            // we need to get the list elements from the wrapper element (its children).
            // NOTE: When layout is not defined (or set to null/false) - this will not be executed!
            // TODO: add support for returning a Table (currently not working without a wrapper)
            if (this.props.layout && React.Children.count(content) === 1 && _.isString(content.type)) {
                return content.props.children;
            }

            return content;
        }

        return React.Children.toArray(children);
    }

    /**
     * @private
     * @param element
     * @returns {*}
     */
    registerElement(element) {
        if (typeof element !== 'object' || element === null) {
            return element;
        }

        if (Webiny.isElementOfType(element, Filters)) {
            return React.cloneElement(element, {
                filters: this.state.filters,
                onFilter: this.setFilters
            });
        }

        const props = _.omit(element.props, ['key', 'ref']);

        if (Webiny.isElementOfType(element, Pagination)) {
            return React.cloneElement(element, this.paginationProps(props));
        }

        if (Webiny.isElementOfType(element, Loader)) {
            return React.cloneElement(element, {show: this.isLoading()});
        }

        if (Webiny.isElementOfType(element, MultiActions)) {
            return React.cloneElement(element, this.multiActionsProps(props));
        }

        if (element.props && element.props.children && !_.isFunction(element.props.children)) {
            return React.cloneElement(element, _.omit(element.props, ['key', 'ref']), React.Children.map(element.props.children, item => {
                return this.registerElement(item);
            }));
        }

        return element;
    }
}

BaseContainer.defaultProps = {
    connectToRouter: false,
    trackLastUsedParameters: true,
    page: 1,
    perPage: 10,
    renderer() {
        const content = this.getContent();

        if (!content) {
            return null;
        }

        if (!this.props.layout) {
            return <webiny-list>{React.Children.map(content, this.registerElement, this)}</webiny-list>;
        }

        this.prepareList(content);
        const layout = this.props.layout.call(this);

        if (React.Children.toArray(layout.props.children).length) {
            const render = [];
            React.Children.map(layout, (item, index) => {
                render.push(React.cloneElement(this.replacePlaceholders(item), {key: index}));
            });
            return <webiny-list>{render}</webiny-list>;
        }

        const layoutProps = {
            list: this.state.list,
            meta: this.state.meta,
            filters: this.filtersElement,
            table: this.tableElement,
            pagination: this.paginationElement,
            multiActions: this.multiActionsElement,
            loader: this.loaderElement ? this.loaderElement : React.createElement(Loader, {show: this.isLoading()}),
            container: this
        };

        return React.cloneElement(layout, layoutProps);
    }
};

export default BaseContainer;