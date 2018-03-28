import React from 'react';
import _ from 'lodash';
import { app, createComponent, ApiComponent, i18n } from 'webiny-app';
import BaseContainer from './BaseContainer';
import sortersToString from './sortersToString';
import styles from './../styles.css';

const t = i18n.namespace("Webiny.Ui.List.ApiContainer");
class ApiContainer extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            initiallyLoaded: false,
            routerParams: null
        };

        this.mounted = false;

        ['loadData', 'recordUpdate', 'recordDelete'].map(m => this[m] = this[m].bind(this));
    }

    componentWillMount() {
        this.mounted = true;

        if (this.props.autoLoad) {
            this.loadData().then(data => {
                if (!this.mounted) {
                    return;
                }
                this.setState({ initiallyLoaded: true });
                this.props.onInitialLoad({ list: _.get(data, 'list'), meta: _.get(data, 'meta') });
            });
        }
    }

    componentDidMount() {
        if (this.props.autoRefresh && _.isNumber(this.props.autoRefresh)) {
            this.autoRefresh = setInterval(() => this.loadData(null, false), 1000 * this.props.autoRefresh);
        }
    }

    componentWillUnmount() {
        this.mounted = false;
        clearInterval(this.autoRefresh);
        if (this.request) {
            // TODO: this.cancelRequest();
        }
    }

    componentWillReceiveProps(props) {
        let shouldLoad = false;

        const propKeys = ['sorters', 'filters', 'perPage', 'page', 'searchQuery', 'searchFields', 'searchOperator'];
        if (!_.isEqual(_.pick(props, propKeys), _.pick(this.props, propKeys))) {
            shouldLoad = true;
        }

        if (this.props.autoLoad && shouldLoad) {
            this.loadData(props).then(data => {
                this.props.onLoad({ list: _.get(data, 'list'), meta: _.get(data, 'meta') });
            });
        }
    }

    loadData(props = null, showLoading = true) {
        if (!props) {
            props = this.props;
        }

        if (this.request) {
            // TODO: this.cancelRequest();
        }

        const query = _.assign({}, props.query, {
            _sort: Object.keys(props.sorters).length ? sortersToString(props.sorters) : props.initialSorters,
            _perPage: props.perPage,
            _page: props.page,
            _searchQuery: props.searchQuery,
            _searchFields: props.searchFields,
            _searchOperator: props.searchOperator
        }, props.filters);

        if (showLoading) {
            this.props.showLoading();
        }

        this.request = props.api.request({ params: query }).then(response => {
            const { data } = response.data;
            if (!response.data.code && props.prepareLoadedData) {
                data.list = props.prepareLoadedData({ list: data.list, meta: data.meta, $this: this });
            }

            if (response.data.code) {
                app.services.get('growler').danger(response.data.message, t`That didn\'t go as expected...`, true);
            }

            if (this.mounted) {
                props.setState({ loading: false, ...data, selectedRows: [] });
            }

            return data;
        });

        return this.request;
    }

    recordUpdate(id, attributes) {
        return this.props.api.patch(this.props.api.defaults.url + '/' + id, attributes).then(response => {
            if (!response.data.code) {
                this.loadData();
            } else {
                app.services.get('growler').danger(response.data.message, t`That didn\'t go as expected...`, true);
            }
            return response;
        });
    }

    recordDelete(id, autoRefresh = true) {
        return this.props.api.delete(this.props.api.defaults.url + '/' + id).then(response => {
            if (!response.data.code && autoRefresh) {
                this.loadData();
            } else {
                app.services.get('growler').danger(response.data.message, t`That didn\'t go as expected...`, true);
            }
            return response;
        });
    }

    render() {
        const content = this.props.getContent(this.props.children);

        if (!content) {
            return null;
        }

        if (!this.props.layout) {
            return <webiny-list>{React.Children.map(content, this.prepareElement, this)}</webiny-list>;
        }

        const layoutProps = {
            ...this.props.prepareList(content, {
                actions: {
                    update: this.recordUpdate,
                    delete: this.recordDelete,
                    reload: this.loadData,
                    api: this.props.api
                }
            }),
            list: this.state.list,
            meta: this.state.meta,
            container: this
        };

        return this.props.layout.call(this, layoutProps)
    }
}

ApiContainer.defaultProps = {
    onInitialLoad: _.noop,
    onLoad: _.noop,
    autoLoad: true,
    autoRefresh: null,
    prepareLoadedData: null,
    layout({ filters, table, pagination, multiActions, loader }) {
        const { Grid, styles } = this.props;
        return (
            <webiny-list-layout>
                {loader}
                {filters}
                {table}
                <Grid.Row className={styles.footer}>
                    <Grid.Col sm={4} className={styles.multiAction}>
                        {multiActions}
                    </Grid.Col>
                    <Grid.Col sm={8} className={styles.paginationWrapper}>
                        {pagination}
                    </Grid.Col>
                </Grid.Row>
            </webiny-list-layout>
        );
    }
};

export default createComponent([ApiContainer, BaseContainer, ApiComponent], { modules: ['Grid'], styles });