import React from "react";
import _ from "lodash";
import { app, createComponent, i18n } from "webiny-app";

/**
 * If onClick function we are handling returns a function, the confirmation dialog will be hidden before executing the function.
 * This will prevent unwanted unmounts and execution of code on unmounted components.
 */

const t = i18n.namespace("Webiny.Ui.ClickConfirm");
class ClickConfirm extends React.Component {
    constructor(props) {
        super(props);

        this.message = null;
        this.realOnClick = _.noop;
        this.dialogId = _.uniqueId("click-confirm-");

        this.onClick = this.onClick.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.onCancel = this.onCancel.bind(this);
    }

    onClick(realOnClick) {
        let msg = this.props.message;
        if (_.isFunction(msg)) {
            msg = msg();
        }

        if (!msg && !this.props.renderDialog) {
            this.realOnClick();
            return;
        }

        this.realOnClick = realOnClick;
        this.message = msg;
        this.setState({ time: _.now() }, () => {
            app.services.get("modal").show(this.dialogId);
        });
    }

    onCancel() {
        return app.services
            .get("modal")
            .hide(this.dialogId)
            .then(this.props.onCancel);
    }

    /**
     * The `data` param can be used when creating a custom confirmation dialog (maybe even with a form).
     * When calling `confirm` callback - whatever data is passed to it will be passed down to original `onClick` handler.
     * That way you can dynamically handle the different scenarios of the confirmation dialog.
     *
     * @returns {Promise.<*>}
     */
    onConfirm(data = {}) {
        return Promise.resolve(this.realOnClick(data, this));
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const dialogProps = {
            name: this.dialogId,
            message: this.message,
            onConfirm: this.onConfirm,
            onCancel: this.onCancel,
            onComplete: this.props.onComplete
        };

        const { Modal } = this.props.modules;
        const dialog = _.isFunction(this.props.renderDialog) ? (
            this.props.renderDialog()
        ) : (
            <Modal.Confirmation />
        );

        return (
            <webiny-click-confirm>
                {this.props.children({ showConfirmation: this.onClick })}
                {React.cloneElement(dialog, dialogProps)}
            </webiny-click-confirm>
        );
    }
}

ClickConfirm.defaultProps = {
    message: t`We need you to confirm your action.`,
    onComplete: _.noop,
    onCancel: _.noop,
    renderDialog: null
};

export default createComponent(ClickConfirm, { modules: ["Modal"] });
