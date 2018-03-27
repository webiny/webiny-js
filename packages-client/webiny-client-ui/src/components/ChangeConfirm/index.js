import React from "react";
import _ from "lodash";
import { app, createComponent, i18n } from "webiny-client";

const t = i18n.namespace("Webiny.Ui.ChangeConfirm");
class ChangeConfirm extends React.Component {
    constructor(props) {
        super(props);

        const input = this.getInput(props);
        this.state = {
            value: input.props.value
        };

        this.dialogId = _.uniqueId("change-confirm-");
        this.message = null;

        this.onChange = this.onChange.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.onCancel = this.onCancel.bind(this);
    }

    componentWillReceiveProps(props) {
        const input = this.getInput(props);
        this.setState({ value: input.props.value });
    }

    shouldComponentUpdate(nextProps) {
        return !_.isEqual(nextProps, this.props);
    }

    onChange(value) {
        const input = this.getInput(this.props);
        let component = null;
        if (input.props.form) {
            component = input.props.form.getInput(input.props.name);
        }

        let msg = this.props.message;
        if (_.isFunction(msg)) {
            msg = msg({ value, component });
        }

        if (!msg) {
            this.realOnChange(value);
            return;
        }

        this.message = msg;
        this.value = value;
        app.services.get("modal").show(this.dialogId);
    }

    getInput(props) {
        return React.Children.toArray(props.children)[0];
    }

    onCancel() {
        const cancelValue = this.props.onCancel(this.getInput(this.props).props.form);
        if (!_.isUndefined(cancelValue)) {
            this.realOnChange(cancelValue);
        }
        app.services.get("modal").hide(this.dialogId);
    }

    onConfirm() {
        return this.realOnChange(this.value);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        // Input
        const input = this.getInput(this.props);
        this.realOnChange = input.props.onChange;
        const props = _.omit(input.props, ["onChange"]);
        props.onChange = this.onChange;

        const dialogProps = {
            name: this.dialogId,
            message: () => this.message,
            onConfirm: this.onConfirm,
            onCancel: this.onCancel,
            onComplete: this.props.onComplete
        };

        const { Modal } = this.props;
        const dialog = _.isFunction(this.props.renderDialog) ? (
            this.props.renderDialog()
        ) : (
            <Modal.Confirmation />
        );

        return (
            <webiny-change-confirm>
                {React.cloneElement(input, props)}
                {React.cloneElement(dialog, dialogProps)}
            </webiny-change-confirm>
        );
    }
}

ChangeConfirm.defaultProps = {
    message: t`Confirm value change?`,
    onComplete: _.noop,
    onCancel: _.noop,
    renderDialog: null
};

export default createComponent(ChangeConfirm, { modules: ["Modal"] });
