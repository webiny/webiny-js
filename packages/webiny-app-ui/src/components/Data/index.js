import React from "react";
import _ from "lodash";
import { app, createComponent, ApiComponent } from "webiny-app";
import axios from "axios";

class Data extends React.Component {
    constructor(props) {
        super(props);
        this.autoRefreshInterval = null; // Ony when 'autoRefresh' prop is used
        this.mounted = false;
        this.request = null;
        this.cancelRequest = null;

        this.state = {
            data: null,
            initiallyLoaded: false
        };

        this.setData = this.setData.bind(this);
        this.load = this.load.bind(this);
        this.catchError = this.catchError.bind(this);
        this.getCancelToken = this.getCancelToken.bind(this);
    }

    componentWillMount() {
        this.setState({ loading: true });
    }

    componentDidMount() {
        this.mounted = true;
        this.request = this.props.api
            .request({
                cancelToken: this.getCancelToken()
            })
            .then(response => {
                if (!this.mounted) {
                    return null;
                }
                this.setData(response);
                this.setState({ initiallyLoaded: true });
                this.props.onInitialLoad(response);
                return response.data.data;
            })
            .catch(this.catchError);

        if (_.isNumber(this.props.autoRefresh)) {
            this.autoRefreshInterval = setInterval(() => {
                this.request = this.props.api
                    .request({
                        cancelToken: this.getCancelToken()
                    })
                    .then(response => {
                        this.setData(response);
                        return response.data.data;
                    })
                    .catch(this.catchError);
            }, this.props.autoRefresh * 1000);
        }
    }

    componentWillUnmount() {
        this.mounted = false;

        if (this.cancelRequest) {
            this.cancelRequest();
        }

        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
    }

    getCancelToken() {
        return new axios.CancelToken(cancel => {
            this.cancelRequest = cancel;
        });
    }

    catchError(err) {
        if (axios.isCancel(err)) {
            return this.mounted ? this.setState({ loading: false }) : null;
        }
        app.services.get("growler").danger(err.message);
    }

    setData(response) {
        this.request = null;

        this.setState({
            data: this.props.prepareLoadedData({ data: response.data.data }),
            loading: false
        });
    }

    load(filters = {}) {
        this.setState({ loading: true });
        this.request = this.props.api.request({ params: filters }).then(response => {
            if (!this.mounted) {
                return;
            }
            this.setData(response);
            this.props.onLoad(response);
        });
        return this.request;
    }

    render() {
        if (!_.isFunction(this.props.children)) {
            throw new Error(
                "Warning: Data component only accepts a function as its child element!"
            );
        }

        if (this.props.waitForData && this.state.data === null) {
            return null;
        }

        const { Loader } = this.props;
        const loader = this.state.loading ? <Loader /> : null;

        return (
            <webiny-data>
                {this.props.children.call(this, {
                    data: _.cloneDeep(this.state.data),
                    load: this.load,
                    loader,
                    $this: this
                })}
            </webiny-data>
        );
    }
}

Data.defaultProps = {
    waitForData: true,
    autoRefresh: null,
    onLoad: _.noop,
    onInitialLoad: _.noop,
    prepareLoadedData: ({ data }) => data
};

export default createComponent([Data, ApiComponent], { modules: ["Loader"] });
