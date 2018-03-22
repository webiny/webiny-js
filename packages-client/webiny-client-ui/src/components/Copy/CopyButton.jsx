import React from 'react';
import _ from 'lodash';
import { app, i18n, createComponent } from 'webiny-client';

/**
 * @i18n.namespace Webiny.Ui.Copy.CopyButton
 */
class CopyButton extends React.Component {
    constructor() {
        super();

        this.dom = null;
    }

    componentDidMount() {
        this.interval = setInterval(() => {
            if (this.dom) {
                clearInterval(this.interval);
                this.interval = null;
                this.setup();
            }
        }, 100);
    }

    componentWillUnmount() {
        this.clipboard.destroy();
    }

    setup() {
        this.clipboard = new this.props.Clipboard(this.dom, {
            text: () => {
                return this.props.value;
            }
        });

        this.clipboard.on('success', () => {
            const onSuccessMessage = this.props.onSuccessMessage;
            if (_.isFunction(onSuccessMessage)) {
                onSuccessMessage();
            } else if (_.isString(onSuccessMessage)) {
                app.services.get('growler').info(onSuccessMessage);
            }
        });
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const props = _.omit(this.props, ['renderer', 'onSuccessMessage', 'onCopy', 'value']);
        const { Button } = props;

        return <Button onRef={ref => this.dom = ref} {...props}/>;
    }
}

CopyButton.defaultProps = {
    label: i18n('Copy'),
    onSuccessMessage: i18n('Copied to clipboard!'),
    onCopy: _.noop,
    style: null,
    value: null
};

export default createComponent(CopyButton, { modules: ['Button', { Clipboard: () => import('clipboard') }] });
