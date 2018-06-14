import React from "react";
import _ from "lodash";
import { Component } from "webiny-client";
import withModalDialog from "../withModalDialog";

@withModalDialog()
@Component()
class ModalConfirmationComponent extends React.Component {
    state = {
        loading: false
    };

    showLoading = () => {
        this.setState({ loading: true });
    };

    hideLoading = () => {
        this.setState({ loading: false });
    };

    onCancel = () => {
        if (!this.props.animating) {
            if (_.isFunction(this.props.onCancel)) {
                return this.props.onCancel(this);
            }
            return this.props.hide();
        }
    };

    /**
     * This function is executed when dialog is confirmed, it handles all the maintenance stuff and executes `onConfirm` callback
     * passed through props and also passes optional `data` object to that callback.
     *
     * It can receive a `data` object containing arbitrary data from your custom form, for example.
     *
     * If no `data` is passed - ModalConfirmationComponent dialog will check if `data` prop is defined and use that as data payload for `onConfirm`
     * callbacks.
     *
     * @param data
     * @returns {Promise.<TResult>}
     */
    onConfirm = (data = null) => {
        if (!this.props.animating && _.isFunction(this.props.onConfirm)) {
            this.showLoading();
            data = _.isPlainObject(data) ? data : this.props.data;
            return Promise.resolve(this.props.onConfirm({ data, dialog: this })).then(result => {
                this.hideLoading();
                if (this.props.autoHide) {
                    return this.props.hide().then(() => {
                        // If the result of confirmation is a function, it means we need to hide the dialog before executing it.
                        // This is often necessary if the function will set a new state in the view - it will re-render itself and the modal
                        // animation will be aborted (most common case is delete confirmation).
                        if (_.isFunction(result)) {
                            // The result of the function will be passed to `onComplete` and not the function itself
                            result = result();
                        }
                        this.props.onComplete({ data: result });
                    });
                }
            });
        }
    };

    render() {
        const { children } = this.props;

        return children({
            loading: this.state.loading,
            onConfirm: this.onConfirm,
            onCancel: this.onCancel
        });
    }
}

ModalConfirmationComponent.defaultProps = {
    onConfirm: _.noop,
    onComplete: _.noop,
    onCancel: null,
    autoHide: true,
    data: null
};

export default ModalConfirmationComponent;
