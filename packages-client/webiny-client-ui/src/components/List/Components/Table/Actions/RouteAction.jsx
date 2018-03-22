import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class RouteAction extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.bindMethods('getRoute,getParams');
    }

    getRoute() {
        return _.isFunction(this.props.route) ? this.props.route(this.props.data) : this.props.route;
    }

    getParams() {
        let params = !this.props.params ? Webiny.Router.getRoute(this.getRoute()).paramNames : _.clone(this.props.params);

        if (_.isString(params) || _.isArray(params)) {
            const paramNames = _.isString(params) ? params.split(',') : params;
            params = {};
            paramNames.map(p => {
                params[p] = this.props.data[p];
            });
        }

        if (_.isFunction(params)) {
            //noinspection JSUnresolvedFunction
            params = params(this.props.data);
        }
        return params;
    }
}

RouteAction.defaultProps = {
    params: null,
    route: null,
    data: {},
    label: null,
    hide: null,
    renderer() {
        if (_.isFunction(this.props.hide) && this.props.hide(this.props.data)) {
            return null;
        }

        const {Link, Icon} = this.props;

        return (
            <Link route={this.getRoute()} params={this.getParams()}>
                {this.props.icon ? <Icon icon={this.props.icon}/> : null}
                {this.props.label || this.props.children}
            </Link>
        );
    }
};

export default Webiny.createComponent(RouteAction, {modules: ['Link', 'Icon']});