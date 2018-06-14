import React from "react";
import _ from "lodash";
import { Component } from "webiny-client";

@Component({ modules: ["Link", "Icon", "DownloadLink"] })
class Action extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        if (_.isFunction(this.props.children)) {
            return this.props.children.call(this, { data: this.props.data, $this: this });
        }

        const { modules: { Link, Icon, DownloadLink } } = this.props;

        const icon = this.props.icon ? <Icon icon={this.props.icon} /> : null;

        if (this.props.download) {
            return (
                <DownloadLink download={this.props.download} params={this.props.data}>
                    {icon} {this.props.label}
                </DownloadLink>
            );
        }

        return (
            <Link
                data={this.props.data}
                onClick={() =>
                    this.props.onClick.call(this, { data: this.props.data, $this: this })
                }
            >
                {icon} {this.props.label}
            </Link>
        );
    }
}

Action.defaultProps = {
    icon: null,
    onClick: _.noop,
    download: null
};

export default Action;
