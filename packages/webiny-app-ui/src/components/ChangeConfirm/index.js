import React from "react";
import _ from "lodash";
import { app, createComponent, i18n } from "webiny-app";

const t = i18n.namespace("Webiny.Ui.ChangeConfirm");
class ChangeConfirm extends React.Component {
    constructor(props) {
        super(props);

        this.dialogId = _.uniqueId("change-confirm-");
        this.message = null;

        this.onChange = this.onChange.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.onCancel = this.onCancel.bind(this);
    }

    shouldComponentUpdate(nextProps) {
        return !_.isEqual(nextProps, this.props);
    }

    onChange(value, realOnChange) {
        let msg = this.props.message;
        if (_.isFunction(msg)) {
            msg = msg({ value });
        }

        if (!msg) {
            realOnChange(value);
            return;
        }

        this.realOnChange = realOnChange;
        this.message = msg;
        this.value = value;
        app.services.get("modal").show(this.dialogId);
    }

    onCancel() {
        app.services.get("modal").hide(this.dialogId);
    }

    onConfirm() {
        return this.realOnChange(this.value);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const dialogProps = {
            name: this.dialogId,
            message: () => this.message,
            onConfirm: this.onConfirm,
            onCancel: this.onCancel,
            onComplete: this.props.onComplete
        };

        const { modules: { Modal } } = this.props;
        const dialog = _.isFunction(this.props.renderDialog) ? (
            this.props.renderDialog()
        ) : (
            <Modal.Confirmation />
        );

        return (
            <webiny-change-confirm>
                {this.props.children({ showConfirmation: this.onChange })}
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
