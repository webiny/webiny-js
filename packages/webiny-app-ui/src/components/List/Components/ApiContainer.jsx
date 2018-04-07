import React from "react";
import _ from "lodash";
import debug from "debug";
import { app, createComponent, ApiComponent, i18n } from "webiny-app";
import BaseContainer from "./BaseContainer";
import styles from "./../styles.css";

const log = debug("webiny-app:ApiContainer");

const t = i18n.namespace("Webiny.Ui.List.ApiContainer");

class ApiContainer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            initiallyLoaded: false,
            routerParams: null
        };

        this.mounted = false;

        ["loadData", "recordUpdate", "recordDelete"].map(m => (this[m] = this[m].bind(this)));
    }

    componentWillMount() {
        this.mounted = true;

        if (this.props.autoLoad) {
            this.loadData().then(data => {
                if (!this.mounted) {
                    return;
                }
                this.setState({ initiallyLoaded: true });
                this.props.onInitialLoad({ list: _.get(data, "list"), meta: _.get(data, "meta") });
            });
        }
    }

    componentDidUpdate() {
        log("Did update");
    }

    componentDidMount() {
        this.props.onReady &&
            this.props.onReady({
                reload: this.loadData
            });

        if (this.props.autoRefresh && _.isNumber(this.props.autoRefresh)) {
            this.autoRefresh = setInterval(
                () => this.loadData(null, false),
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

        const propKeys = ["sorters", "filters", "perPage", "page", "search"];
        if (!_.isEqual(_.pick(props, propKeys), _.pick(this.props, propKeys))) {
            shouldLoad = true;
        }

        if (this.props.autoLoad && shouldLoad) {
            this.loadData(props).then(data => {
                this.props.onLoad({ list: _.get(data, "list"), meta: _.get(data, "meta") });
            });
        }
    }

    loadData(props = null, showLoading = true) {
        if (!props) {
            props = this.props;
        }

        const variables = {
            filter: _.pickBy(props.filters, v => !_.isNil(v)),
            sort: props.sorters || props.initialSorters,
            perPage: props.perPage,
            page: props.page
        };

        if (!_.isEmpty(props.search.query)) {
            variables.search = props.search;
        }

        if (showLoading) {
            this.setState({ loading: true });
        }

        log("Loading data");
        return props.queries.list({ fields: props.fields, variables }).then(({ error, data }) => {
            log("Loaded data");
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
                this.setState({ loading: false }, () =>
                    props.setState({ ...data, selectedRows: [] })
                );
            }

            return data;
        });
    }

    recordUpdate(id, data) {
        return this.props.queries
            .update({ fields: this.props.fields, variables: { id, data } })
            .then(({ error, data }) => {
                if (!error) {
                    this.loadData();
                } else {
                    app.services
                        .get("growler")
                        .danger(error.message, t`That didn\'t go as expected...`, true);
                }
                return data;
            });
    }

    recordDelete(id, autoRefresh = true) {
        return this.props.queries
            .delete({ fields: this.props.fields, variables: { id } })
            .then(({ error, data }) => {
                if (!error && autoRefresh) {
                    this.loadData();
                } else {
                    app.services
                        .get("growler")
                        .danger(error.message, t`That didn\'t go as expected...`, true);
                }
                return data;
            });
    }

    render() {
        log("Render begin");
        const content = this.props.getContent(this.props.children);

        if (!content) {
            return null;
        }

        const layoutProps = {
            ...this.props.prepareList(content, {
                loading: this.state.loading,
                actions: {
                    update: this.recordUpdate,
                    delete: this.recordDelete,
                    reload: this.loadData
                }
            }),
            list: this.state.list,
            meta: this.state.meta
        };

        log("Render layout");
        return this.props.layout.call(this, layoutProps);
    }
}

ApiContainer.defaultProps = {
    onInitialLoad: _.noop,
    onLoad: _.noop,
    autoLoad: true,
    autoRefresh: null,
    prepareLoadedData: null,
    layout({ filtersElement, dataElement, paginationElement, multiActionsElement, loaderElement }) {
        const { Grid, styles } = this.props;
        return (
            <webiny-list-layout>
                {loaderElement}
                {filtersElement}
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

export default createComponent([ApiContainer, BaseContainer], {
    modules: ["Grid"],
    styles
});
