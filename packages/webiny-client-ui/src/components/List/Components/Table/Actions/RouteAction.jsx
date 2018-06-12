import React from "react";
import _ from "lodash";
import { app, createComponent } from "webiny-client";

class RouteAction extends React.Component {
    constructor(props) {
        super(props);

        ["getRoute", "getParams"].map(m => (this[m] = this[m].bind(this)));
    }

    getRoute() {
        return _.isFunction(this.props.route)
            ? this.props.route(this.props.data)
            : this.props.route;
    }

    getParams() {
        let params = {};

        if (!this.props.params) {
            const routeParams = app.router.getRoute(this.getRoute()).params;
            routeParams.map(p => {
                params[p.name] = this.props.data[p.name];
            });
        } else {
            params = { ...this.props.params };
        }

        if (_.isFunction(params)) {
            //noinspection JSUnresolvedFunction
            params = params(this.props.data);
        }

        return params;
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        if (_.isFunction(this.props.hide) && this.props.hide(this.props.data)) {
            return null;
        }

        const { modules: { Link, Icon } } = this.props;

        return (
            <Link route={this.getRoute()} params={this.getParams()}>
                {this.props.icon ? <Icon icon={this.props.icon} /> : null}
                {this.props.label || this.props.children}
            </Link>
        );
    }
}

RouteAction.defaultProps = {
    params: null,
    route: null,
    data: {},
    label: null,
    hide: null
};

export default createComponent(RouteAction, { modules: ["Link", "Icon"] });
