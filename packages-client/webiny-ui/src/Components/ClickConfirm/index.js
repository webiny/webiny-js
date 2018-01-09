import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

/**
 * If onClick function we are handling returns a function, the confirmation dialog will be hidden before executing the function.
 * This will prevent unwanted unmounts and execution of code on unmounted components.
 */

/**
 * @i18n.namespace Webiny.Ui.ClickConfirm
 */
class ClickConfirm extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.message = null;
        this.realOnClick = _.noop;

        this.bindMethods('onClick,onConfirm,onCancel');
    }

    onClick() {
        let msg = this.props.message;
        if (_.isFunction(msg)) {
            msg = msg();
        }

        if (!msg && !this.props.renderDialog) {
            this.realOnClick();
            return;
        }

        this.message = msg;
        this.setState({time: _.now()}, this.refs.dialog.show);
    }

    getInput(props) {
        return React.Children.toArray(props.children)[0];
    }

    onCancel() {
        this.refs.dialog.hide().then(this.props.onCancel);
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
}

ClickConfirm.defaultProps = {
    message: Webiny.I18n('We need you to confirm your action.'),
    onComplete: _.noop,
    onCancel: _.noop,
    renderDialog: null,
    renderer() {
        // Input
        const input = this.getInput(this.props);
        this.realOnClick = input.props.onClick;
        const props = _.omit(input.props, ['onClick']);
        props.onClick = this.onClick;


        const dialogProps = {
            ref: 'dialog',
            message: this.message,
            onConfirm: this.onConfirm,
            onCancel: this.onCancel,
            onComplete: this.props.onComplete
        };

        if (_.isFunction(this.props.renderDialog)) {
            dialogProps['renderDialog'] = this.props.renderDialog;
        }

        const {Modal} = this.props;

        return (
            <webiny-click-confirm>
                {React.cloneElement(input, props)}
                <Modal.Confirmation {...dialogProps}/>
            </webiny-click-confirm>
        );
    }
};

export default Webiny.createComponent(ClickConfirm, {modules: ['Modal']});
