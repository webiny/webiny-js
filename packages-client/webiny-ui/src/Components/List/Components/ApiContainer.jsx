import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import BaseContainer from './BaseContainer';
import styles from './../styles.css';

/**
 * @i18n.namespace Webiny.Ui.List.ApiContainer
 */
class ApiContainer extends BaseContainer {

    constructor(props) {
        super(props);
        _.assign(this.state, {
            initiallyLoaded: false,
            routerParams: null
        });
        Webiny.Mixins.ApiComponent.extend(this);
    }

    componentWillMount() {
        super.componentWillMount();
        this.prepare(this.props).then(() => {
            if (this.props.autoLoad) {
                this.loadData().then(data => {
                    if (!this.isMounted()) {
                        return;
                    }
                    this.setState({initiallyLoaded: true});
                    this.props.onInitialLoad({list: _.get(data, 'list'), meta: _.get(data, 'meta')});
                });
            }
        });
    }

    componentDidMount() {
        super.componentDidMount();
        if (this.props.autoRefresh && _.isNumber(this.props.autoRefresh)) {
            this.autoRefresh = setInterval(() => this.loadData(null, false), 1000 * this.props.autoRefresh);
        }
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        clearInterval(this.autoRefresh);
        if (this.request) {
            this.request.cancel();
        }
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        let shouldLoad = false;

        if (props.url !== this.props.url) {
            shouldLoad = true;
            this.api.setUrl(props.url);
        }

        if (!_.isEqual(props.query, this.props.query)) {
            shouldLoad = true;
        }

        if (this.props.connectToRouter) {
            const routerParams = Webiny.Router.getQueryParams();
            if (!_.isEqual(this.state.routerParams, routerParams)) {
                this.setState({routerParams});
                shouldLoad = true;
            }
        }

        if (this.props.autoLoad && shouldLoad) {
            this.prepare(props).then(() => {
                this.loadData(props).then(data => {
                    this.props.onLoad({list: _.get(data, 'list'), meta: _.get(data, 'meta')});
                });
            });
        }
    }

    loadData(props = null, showLoading = true) {
        if (this.request) {
            this.request.cancel();
        }

        if (!props) {
            props = this.props;
        }
        this.setState({selectedRows: []});
        const query = _.assign({}, props.query, {
            _sort: Object.keys(this.state.sorters).length ? Webiny.Router.sortersToString(this.state.sorters) : this.state.initialSorters,
            _perPage: this.state.perPage,
            _page: this.state.page,
            _searchQuery: this.state.searchQuery,
            _searchFields: this.state.searchFields,
            _searchOperator: this.state.searchOperator
        }, this.state.filters);

        if (showLoading) {
            this.showLoading();
        }

        this.request = this.api.setQuery(query).execute().then(apiResponse => {
            const data = apiResponse.getData();
            if (!apiResponse.isError() && !apiResponse.isAborted()) {
                if (this.props.prepareLoadedData) {
                    data.list = this.props.prepareLoadedData({list: data.list, meta: data.meta, $this: this});
                }
            }

            if (apiResponse.isError()) {
                Webiny.Growl.danger(apiResponse.getMessage(), this.i18n('That didn\'t go as expected...'), true);
            }

            if (this.isMounted()) {
                this.setState(_.merge({loading: false}, data));
            }

            return data;
        });

        return this.request;
    }

    getContainerActions() {
        const actions = super.getContainerActions();
        actions.api = this.api;
        return actions;
    }

    recordUpdate(id, attributes) {
        return this.api.patch(id, attributes).then(apiResponse => {
            if (!apiResponse.isError()) {
                this.loadData();
            } else {
                Webiny.Growl.danger(apiResponse.getMessage(), this.i18n('That didn\'t go as expected...'), true);
            }
            return apiResponse;
        });
    }

    recordDelete(id, autoRefresh = true) {
        return this.api.delete(id).then(apiResponse => {
            if (!apiResponse.isError() && autoRefresh) {
                this.loadData();
            }
            return apiResponse;
        });
    }
}

ApiContainer.defaultProps = _.merge({}, BaseContainer.defaultProps, {
    onInitialLoad: _.noop,
    onLoad: _.noop,
    autoLoad: true,
    autoRefresh: null,
    prepareLoadedData: null,
    layout() {
        const {Grid, styles} = this.props;
        return (
            <webiny-list-layout>
                <loader/>
                <filters/>
                <table/>
                <Grid.Row className={styles.footer}>
                    <Grid.Col sm={4} className={styles.multiAction}>
                        <multi-actions/>
                    </Grid.Col>
                    <Grid.Col sm={8} className={styles.paginationWrapper}>
                        <pagination/>
                    </Grid.Col>
                </Grid.Row>
            </webiny-list-layout>
        );
    }
});

export default Webiny.createComponent(ApiContainer, {modules: ['Grid'], api: ['loadData'], styles});