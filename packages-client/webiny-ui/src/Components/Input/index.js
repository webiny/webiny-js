import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Input extends Webiny.Ui.FormComponent {

    constructor(props) {
        super(props);

        this.bindMethods('focus,renderValidationIcon');
    }

    onKeyDown({event}) {
        if (event.metaKey || event.ctrlKey) {
            return;
        }

        switch (event.key) {
            case 'Enter':
                if (this.props.onEnter && this.props.onEnter !== _.noop) {
                    event.preventDefault();
                    this.props.onEnter({event, component: this});
                }
                break;
            default:
                break;
        }
    }

    focus() {
        ReactDOM.findDOMNode(this).querySelector('input').focus();
    }

    renderValidationIcon() {
        return this.props.validationIconRenderer.call(this);
    }
}

Input.defaultProps = Webiny.Ui.FormComponent.extendProps({
    delay: 400,
    name: null,
    onEnter: _.noop, // NOTE: only works if inside a Form
    onKeyDown: _.noop,
    onKeyUp: _.noop,
    placeholder: null,
    readOnly: false,
    type: 'text',
    autoFocus: null,
    addonLeft: null,
    addonRight: null,
    iconLeft: null,
    iconRight: null,
    wrapperClassName: '',
    validationIconRenderer() {
        if (!this.props.showValidationIcon || this.state.isValid === null) {
            return null;
        }

        const {FormGroup} = this.props;

        if (this.state.isValid === true) {
            return <FormGroup.ValidationIcon/>;
        }
        return <FormGroup.ValidationIcon error/>;
    },
    renderer() {
        const {DelayedOnChange, Icon, styles, FormGroup} = this.props;

        const props = {
            'data-on-enter': this.props.onEnter !== _.noop,
            onBlur: this.props.validateInput ? this.validate : this.props.onBlur,
            disabled: this.isDisabled(),
            readOnly: this.props.readOnly,
            type: this.props.type,
            className: styles.input,
            value: this.getValue() || '',
            placeholder: this.getPlaceholder(),
            onKeyUp: event => this.props.onKeyUp({event, component: this}),
            onKeyDown: event => (this.props.onKeyDown !== _.noop ? this.props.onKeyDown : this.onKeyDown.bind(this))({event, component: this}),
            onChange: this.props.onChange,
            autoFocus: this.props.autoFocus
        };

        let showValidationIcon = true;
        let addonLeft = '';
        if (this.props.addonLeft) {
            addonLeft = <span className={styles.addon}>{this.props.addonLeft}</span>;
            showValidationIcon = false;
        }

        let addonRight = '';
        if (this.props.addonRight) {
            addonRight = <span className={styles.addon}>{this.props.addonRight}</span>;
            showValidationIcon = false;
        }

        let wrapperClassName = this.props.wrapperClassName + ' inputGroup';
        let iconLeft = '';
        if (this.props.iconLeft) {
            wrapperClassName += ' ' + styles.iconLeft;
            iconLeft = <Icon icon={this.props.iconLeft}/>;
        }

        let iconRight = '';
        if (this.props.iconRight) {
            wrapperClassName += ' ' + styles.iconRight;
            iconRight = <Icon icon={this.props.iconRight}/>;
        }

        return (
            <FormGroup valid={this.state.isValid} className={this.props.className}>
                {this.renderLabel()}
                {this.renderInfo()}

                <div className={wrapperClassName}>
                    {iconLeft}
                    {addonLeft}
                    <DelayedOnChange delay={this.props.delay}>
                        <input {...props}/>
                    </DelayedOnChange>
                    {addonRight}
                    {iconRight}
                    {showValidationIcon && this.renderValidationIcon()}
                </div>
                {this.renderDescription()}
                {this.renderValidationMessage()}
            </FormGroup>
        );
    }
});

export default Webiny.createComponent(Input, {modules: ['DelayedOnChange', 'Icon', 'FormGroup'], styles});
