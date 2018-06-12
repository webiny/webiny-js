import React from "react";
import _ from "lodash";
import { app, createComponent } from "webiny-client";

class ClickSuccess extends React.Component {
    constructor(props) {
        super(props);

        this.state = { data: {} };
        this.dialogId = _.uniqueId("click-success-");

        this.getContent = this.getContent.bind(this);
        this.onClick = this.onClick.bind(this);
        this.hide = this.hide.bind(this);
    }

    hide() {
        return app.services.get("modal").hide(this.dialogId);
    }

    onClick() {
        return Promise.resolve(this.realOnClick(this)).then(() => {
            return app.services.get("modal").show(this.dialogId);
        });
    }

    getContent() {
        const content = this.props.children;
        if (_.isFunction(content)) {
            return content({
                success: ({ data }) => {
                    this.setState({ data }, () => {
                        app.services.get("modal").show(this.dialogId);
                    });
                }
            });
        }

        const input = React.Children.toArray(content)[0];
        this.realOnClick = input.props.onClick;
        const props = _.omit(input.props, ["onClick"]);
        props.onClick = this.onClick;
        return React.cloneElement(input, props);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const dialogProps = {
            name: this.dialogId,
            message: () =>
                _.isFunction(this.props.message)
                    ? this.props.message(this.state.data)
                    : this.props.message,
            onClose: () => {
                this.hide().then(this.props.onClose);
            }
        };

        const { Modal } = this.props.modules;

        return (
            <webiny-click-success>
                {this.getContent()}
                <Modal.Success {...dialogProps} />
            </webiny-click-success>
        );
    }
}

ClickSuccess.defaultProps = {
    onClose: _.noop,
    message: null,
    renderDialog: null
};

export default createComponent(ClickSuccess, { modules: ["Modal"] });
