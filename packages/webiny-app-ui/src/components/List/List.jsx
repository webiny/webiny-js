import React from "react";
import _ from "lodash";
import { app, createComponent, elementHasFlag, i18n, ApiComponent } from "webiny-app";
import ListContext from "./Components/ListContext";
import Loader from "./Components/ListLoader";
import styles from "./styles.css";

const t = i18n.namespace("Webiny.Ui.List");

class List extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            initialSorters: { ...props.sort },
            loading: false,
            initiallyLoaded: false,
            list: [],
            meta: {},
            selectedRows: []
        };

        this.mounted = false;

        ["loadRecords", "updateRecord", "deleteRecord"].map(m => (this[m] = this[m].bind(this)));
    }

    componentWillMount() {
        this.mounted = true;

        if (this.props.autoLoad) {
            this.loadRecords().then(data => {
                if (!this.mounted) {
                    return;
                }
                this.setState({ initiallyLoaded: true });
                this.props.onInitialLoad({ list: _.get(data, "list"), meta: _.get(data, "meta") });
            });
        }
    }

    componentDidMount() {
        this.props.onReady &&
            this.props.onReady({
                reload: this.loadRecords
            });

        if (this.props.autoRefresh && _.isNumber(this.props.autoRefresh)) {
            this.autoRefresh = setInterval(
                () => this.loadRecords(null, false),
                1000 * this.props.autoRefresh
            );
        }
    }

    componentWillUnmount() {
        this.mounted = false;
        clearInterval(this.autoRefresh);
    }

    componentWillReceiveProps(props) {
        let shouldLoad = false;

        const propKeys = ["sort", "filter", "perPage", "page", "search"];
        if (!_.isEqual(_.pick(props, propKeys), _.pick(this.props, propKeys))) {
            shouldLoad = true;
        }

        if (this.props.autoLoad && shouldLoad) {
            this.loadRecords(props).then(data => {
                this.props.onLoad({ list: _.get(data, "list"), meta: _.get(data, "meta") });
            });
        }
    }

    loadRecords(props = null, showLoading = true) {
        if (!props) {
            props = this.props;
        }

        const variables = {
            filter: _.pickBy(props.filter, v => !_.isNil(v)),
            sort: props.sort || props.initialSorters,
            perPage: props.perPage,
            page: props.page
        };

        if (!_.isEmpty(props.search.query)) {
            variables.search = props.search;
        }

        if (showLoading) {
            this.setState({ loading: true });
        }

        return props.api.list({ variables }).then(({ error, data }) => {
            if (!error && props.prepareLoadedData) {
                data.list = props.prepareLoadedData({
                    list: data.list,
                    meta: data.meta,
                    $this: this
                });
            }

            if (error) {
                app.services
                    .get("growler")
                    .danger(error.message, t`That didn\'t go as expected...`, true);
            }

            if (this.mounted) {
                this.setState({ loading: false, ...data, selectedRows: [] });
            }

            return data;
        });
    }

    updateRecord(id, data) {
        // TODO: @error handling
        return this.props.api.update({ variables: { id, data } }).then(({ error, data }) => {
            if (!error) {
                this.loadRecords();
            } else {
                app.services
                    .get("growler")
                    .danger(error.message, t`That didn\'t go as expected...`, true);
            }
            return data;
        });
    }

    deleteRecord(id, autoRefresh = true) {
        return this.props.api.delete({ variables: { id } }).then(({ error, data }) => {
            if (!error) {
                autoRefresh && this.loadRecords();
            } else {
                app.services
                    .get("growler")
                    .danger(error.message, t`That didn\'t go as expected...`, true);
            }
            return data;
        });
    }

    onSelect(selectedRows) {
        this.setState({ selectedRows });
    }

    tableProps(tableProps) {
        _.assign(tableProps, {
            data: _.cloneDeep(this.state.list),
            sort: _.cloneDeep(this.props.sort),
            onSort: this.props.setSort.bind(this),
            selectedRows: [...this.state.selectedRows]
        });

        return tableProps;
    }

    paginationProps(paginationProps) {
        _.assign(paginationProps, {
            onPageChange: this.props.setPage.bind(this),
            onPerPageChange: this.props.setPerPage.bind(this),
            currentPage: this.props.page,
            perPage: this.props.perPage,
            count: _.get(this.state.meta, "count", 0),
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
     */
    prepareList(children, listProps) {
        React.Children.map(
            children,
            child => {
                if (elementHasFlag(child, "listFiltersComponent")) {
                    // Need to omit fields that are not actual filters
                    this.filterElement = React.cloneElement(child, {
                        filter: { ...this.props.filter, search: this.props.search },
                        onFilter: this.props.setFilter.bind(this)
                    });
                }

                const props = _.omit(child.props, ["children", "key", "ref"]);
                if (elementHasFlag(child, "listDataComponent")) {
                    this.dataElement = React.cloneElement(child, {
                        ...this.tableProps(props),
                        ...listProps
                    });
                }

                if (elementHasFlag(child, "listPaginationComponent")) {
                    this.paginationElement = React.cloneElement(child, {
                        ...this.paginationProps(props),
                        ...listProps
                    });
                }

                if (elementHasFlag(child, "listLoaderComponent")) {
                    this.loaderElement = child;
                }

                if (elementHasFlag(child, "listMultiActionsComponent")) {
                    this.multiActionsElement = React.cloneElement(child, {
                        ...this.multiActionsProps(props),
                        ...listProps
                    });
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
            this.dataElement = React.cloneElement(this.dataElement, {
                onSelect: this.onSelect.bind(this)
            });
        }
    }

    render() {
        const content = React.Children.toArray(this.props.children);

        if (!content) {
            return null;
        }

        const listProps = {
            loading: this.state.loading,
            actions: {
                update: this.updateRecord,
                delete: this.deleteRecord,
                reload: this.loadRecords
            }
        };

        this.prepareList(content, listProps);

        const layoutProps = {
            list: this.state.list,
            meta: this.state.meta,
            filterElement: this.filterElement,
            dataElement: this.dataElement,
            paginationElement: this.paginationElement,
            multiActionsElement: this.multiActionsElement,
            loaderElement: this.loaderElement,
            ...listProps
        };

        return this.props.renderLayout.call(this, layoutProps);
    }
}

List.defaultProps = {
    onInitialLoad: _.noop,
    onLoad: _.noop,
    autoLoad: true,
    autoRefresh: null,
    prepareLoadedData: null,
    renderLayout({
        filterElement,
        dataElement,
        paginationElement,
        multiActionsElement,
        loaderElement
    }) {
        const { Grid, styles } = this.props;
        return (
            <webiny-list-layout>
                {loaderElement}
                {filterElement}
                {dataElement}
                <Grid.Row className={styles.footer}>
                    <Grid.Col sm={4} className={styles.multiAction}>
                        {multiActionsElement}
                    </Grid.Col>
                    <Grid.Col sm={8} className={styles.paginationWrapper}>
                        {paginationElement}
                    </Grid.Col>
                </Grid.Row>
            </webiny-list-layout>
        );
    }
};

export default createComponent([List, ApiComponent, ListContext], {
    modules: ["Grid"],
    styles
});
