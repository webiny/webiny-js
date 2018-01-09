import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Ui.Copy.CopyButton
 */
class CopyButton extends Webiny.Ui.Component {
    componentDidMount() {
        super.componentDidMount();
        this.interval = setInterval(() => {
            const dom = ReactDOM.findDOMNode(this);
            if (dom) {
                clearInterval(this.interval);
                this.interval = null;
                this.setup();
            }
        }, 100);
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.clipboard.destroy();
    }

    setup() {
        this.clipboard = new this.props.Clipboard(ReactDOM.findDOMNode(this), {
            text: () => {
                return this.props.value;
            }
        });

        this.clipboard.on('success', () => {
            const onSuccessMessage = this.props.onSuccessMessage;
            if (_.isFunction(onSuccessMessage)) {
                onSuccessMessage();
            } else if (_.isString(onSuccessMessage)) {
                Webiny.Growl.info(onSuccessMessage);
            }
        });
    }
}

CopyButton.defaultProps = {
    label: Webiny.I18n('Copy'),
    onSuccessMessage: Webiny.I18n('Copied to clipboard!'),
    onCopy: _.noop,
    style: null,
    value: null,
    renderer() {
        const props = _.omit(this.props, ['renderer', 'onSuccessMessage', 'onCopy', 'value']);
        const {Button} = props;

        return <Button {...props}/>;
    }
};

export default Webiny.createComponent(CopyButton, {modules: ['Button', {Clipboard: () => import('clipboard')}]});
