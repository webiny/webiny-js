import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-client";

class MultiAction extends React.Component {
    constructor(props) {
        super(props);

        this.onAction = this.onAction.bind(this);
    }

    onAction() {
        this.props.onAction({ data: this.props.data, actions: this.props.actions });
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { modules: { Link, DownloadLink } } = this.props;

        if (!this.props.data.length && !this.props.allowEmpty) {
            return <Link onClick={_.noop}>{this.props.label}</Link>;
        }

        if (this.props.download) {
            return (
                <DownloadLink download={this.props.download} params={this.props.data}>
                    {this.props.label}
                </DownloadLink>
            );
        }

        return <Link onClick={this.onAction}>{this.props.label}</Link>;
    }
}

MultiAction.defaultProps = {
    allowEmpty: false,
    onAction: _.noop,
    download: null,
    actions: null,
    data: []
};

export default createComponent(MultiAction, { modules: ["Link", "DownloadLink"] });
