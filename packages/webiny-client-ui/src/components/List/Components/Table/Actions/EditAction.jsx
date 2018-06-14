import React from "react";
import _ from "lodash";
import { inject } from "webiny-client";
import RouteAction from "./RouteAction";

@inject({ modules: ["Link", "Icon"] })
class EditAction extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const props = _.pick(this.props, ["data", "label", "icon"]);
        const { modules: { Link, Icon } } = this.props;

        if (this.props.onClick) {
            const icon = props.icon ? <Icon icon={props.icon} /> : null;
            props.onClick = () => this.props.onClick({ data: this.props.data });
            return (
                <Link {...props}>
                    {icon}
                    {props.label}
                </Link>
            );
        }

        if (this.props.route) {
            let route = this.props.route;
            if (_.isFunction(route)) {
                route = route(this.props.data);
            }
            props.route = route;
        }

        return <RouteAction {...props} />;
    }
}

EditAction.defaultProps = {
    label: "Edit",
    icon: ["fas", "pencil-alt"]
};

export default EditAction;
