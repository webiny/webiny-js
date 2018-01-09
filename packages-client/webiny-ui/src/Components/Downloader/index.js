import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class Downloader extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.state = {};
        this.downloaded = true;

        this.bindMethods('download');
    }

    componentDidUpdate() {
        super.componentDidUpdate();
        if (this.refs.downloader) {
            ReactDOM.findDOMNode(this.refs.downloader).submit();
        }
    }

    download(httpMethod, url, params = null) {
        this.downloaded = false;
        this.setState({httpMethod, url, params: _.pickBy(params, f => !_.isUndefined(f))});
    }
}

Downloader.defaultProps = {
    debug: false,
    debugKey: 'PHPSTORM',
    tokenCookie: 'webiny-token',
    renderer() {
        if (this.downloaded) {
            return null;
        }

        let action = this.state.url;
        if (!action.startsWith('http')) {
            action = Webiny.Config.ApiUrl + action;
        }

        let params = null;
        if (this.state.params) {
            params = [];
            _.each(this.state.params, (value, name) => {
                if (_.isArray(value)) {
                    value.map((v, index) => {
                        params.push(
                            <input type="hidden" name={name + '[]'} value={v} key={name + '-' + index}/>
                        );
                    });
                    return;
                }
                params.push(<input type="hidden" name={name} value={value} key={name}/>);
            });
        }

        let authorization = null;
        if (this.state.httpMethod !== 'GET') {
            authorization = <input type="hidden" name="X-Webiny-Authorization" value={Webiny.Cookies.get(this.props.tokenCookie)}/>;
        }

        this.downloaded = true;

        let debug = null;
        if (this.props.debug) {
            debug = <input type="hidden" name="XDEBUG_SESSION_START" value={this.props.debugKey}/>;
        }

        return (
            <form ref="downloader" action={action} method={this.state.httpMethod} target="_blank">
                {params}
                {authorization}
                {debug}
            </form>
        );
    }
};

export default Webiny.createComponent(Downloader, {api: ['download']});