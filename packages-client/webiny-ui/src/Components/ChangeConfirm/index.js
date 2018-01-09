import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Ui.ChangeConfirm
 */
class ChangeConfirm extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        const input = this.getInput(props);
        this.state = {
            value: input.props.value
        };

        this.message = null;

        this.bindMethods('onChange,onConfirm,onCancel');
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        const input = this.getInput(props);
        this.setState({value: input.props.value});
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
            msg = msg({value, component});
        }

        if (!msg) {
            this.realOnChange(value);
            return;
        }

        this.message = msg;
        this.value = value;
        this.refs.dialog.show();
    }

    getInput(props) {
        return React.Children.toArray(props.children)[0];
    }

    onCancel() {
        const cancelValue = this.props.onCancel(this.getInput(this.props).props.form);
        if (!_.isUndefined(cancelValue)) {
            this.realOnChange(cancelValue);
        }
        this.refs.dialog.hide();
    }

    onConfirm() {
        return this.realOnChange(this.value);
    }
}

ChangeConfirm.defaultProps = {
    message: Webiny.I18n('Confirm value change?'),
    onComplete: _.noop,
    onCancel: _.noop,
    renderDialog: null,
    renderer() {
        // Input
        const input = this.getInput(this.props);
        this.realOnChange = input.props.onChange;
        const props = _.omit(input.props, ['onChange']);
        props.onChange = this.onChange;

        const dialogProps = {
            ref: 'dialog',
            message: () => this.message,
            onConfirm: this.onConfirm,
            onCancel: this.onCancel,
            onComplete: this.props.onComplete
        };

        if (_.isFunction(this.props.renderDialog)) {
            dialogProps['renderDialog'] = this.props.renderDialog;
        }

        const {Modal} = this.props;

        return (
            <webiny-change-confirm>
                {React.cloneElement(input, props)}
                <Modal.Confirmation {...dialogProps}/>
            </webiny-change-confirm>
        );
    }
};

export default Webiny.createComponent(ChangeConfirm, {modules: ['Modal']});
