import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Ui.Data
 */
class Data extends Webiny.Ui.Component {

    constructor(props) {
        super(props);
        this.autoRefreshInterval = null; // Ony when 'autoRefresh' prop is used

        this.state = {
            data: null,
            initiallyLoaded: false
        };

        this.bindMethods('setData,load');
        Webiny.Mixins.ApiComponent.extend(this);
    }

    componentWillMount() {
        super.componentWillMount();
        this.setState({loading: true});
    }

    componentDidMount() {
        super.componentDidMount();
        this.request = this.api.execute().then(apiResponse => {
            if (!this.isMounted()) {
                return null;
            }
            this.setData(apiResponse);
            this.setState({initiallyLoaded: true});
            this.props.onInitialLoad(apiResponse);
            return apiResponse.getData();
        });

        if (_.isNumber(this.props.autoRefresh)) {
            this.autoRefreshInterval = setInterval(() => {
                this.request = this.api.execute().then(response => {
                    this.setData(response);
                    return response.getData();
                });
            }, this.props.autoRefresh * 1000);
        }
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        if (this.request) {
            this.request.cancel();
        }

        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
    }

    setData(response) {
        this.request = null;
        if (response.isAborted() || !this.isMounted()) {
            return;
        }

        if (response.isError()) {
            this.setState({loading: false});
            Webiny.Growl.info(response.getError(), this.i18n('Could not fetch data'), true);
            return;
        }
        this.setState({data: this.props.prepareLoadedData({data: response.getData()}), loading: false});
    }

    load(filters = {}) {
        this.setState({loading: true});
        this.request = this.api.setQuery(filters).execute().then(apiResponse => {
            if (!this.isMounted()) {
                return;
            }
            this.setData(apiResponse);
            this.props.onLoad(apiResponse);
        });
        return this.request;
    }
}

Data.defaultProps = {
    waitForData: true,
    autoRefresh: null,
    onLoad: _.noop,
    onInitialLoad: _.noop,
    prepareLoadedData: ({data}) => data,
    renderer() {
        if (!_.isFunction(this.props.children)) {
            throw new Error('Warning: Data component only accepts a function as its child element!');
        }

        if (this.props.waitForData && this.state.data === null) {
            return null;
        }

        const {Loader} = this.props;
        const loader = this.state.loading ? <Loader/> : null;

        return (
            <webiny-data>
                {this.props.children.call(this, {
                    data: _.cloneDeep(this.state.data),
                    load: this.load,
                    loader: loader,
                    $this: this
                })}
            </webiny-data>
        );
    }
};

export default Webiny.createComponent(Data, {modules: ['Loader']});