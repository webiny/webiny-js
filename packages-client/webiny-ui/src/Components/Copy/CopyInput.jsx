import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

/**
 * @i18n.namespace Webiny.Ui.Copy.CopyInput
 */
class CopyInput extends Webiny.Ui.FormComponent {
    componentDidMount() {
        super.componentDidMount();

        this.interval = setInterval(() => {
            const dom = ReactDOM.findDOMNode(this).querySelector('button');
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
        const button = ReactDOM.findDOMNode(this).querySelector('button');

        this.clipboard = new this.props.Clipboard(button, {
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

CopyInput.defaultProps = Webiny.Ui.FormComponent.extendProps({
    actionLabel: Webiny.I18n('Copy'),
    onSuccessMessage: Webiny.I18n('Copied to clipboard!'),
    onCopy: _.noop,
    renderer() {
        const {Button, FormGroup, styles} = this.props;

        const props = {
            readOnly: true,
            type: 'text',
            className: styles.input,
            value: this.props.value || ''
        };

        return (
            <FormGroup valid={this.state.isValid} className={this.props.className}>
                {this.renderLabel()}
                {this.renderInfo()}
                <div className="inputGroup">
                    <input {...props}/>
                    <Button type="primary" className={styles.btnCopy}>
                        {this.props.actionLabel}
                    </Button>
                </div>
                {this.renderDescription()}
            </FormGroup>
        );
    }
});

export default Webiny.createComponent(CopyInput, {styles, modules: ['Button', 'FormGroup', {Clipboard: () => import('clipboard')}]});
