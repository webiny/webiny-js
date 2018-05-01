import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-app";

class Link extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { modules: { Link, Icon }, ...props } = this.props;
        const icon = props.icon ? <Icon icon={props.icon} /> : null;
        let link = (
            <Link onClick={this.props.onClick} route={this.props.route} params={this.props.params}>
                {icon} {props.title}
            </Link>
        );

        if (props.children && !_.isString(props.children)) {
            link = this.props.children;
        }

        return <li role="presentation">{link}</li>;
    }
}

Link.defaultProps = {
    route: null,
    params: null
};

export default createComponent(Link, { modules: ["Link", "Icon"] });
