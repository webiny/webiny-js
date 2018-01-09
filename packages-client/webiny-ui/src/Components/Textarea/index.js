import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Textarea extends Webiny.Ui.FormComponent {

}

Textarea.defaultProps = Webiny.Ui.FormComponent.extendProps({
    delay: 400,
    renderer() {
        const {FormGroup, styles} = this.props;

        const props = {
            onBlur: this.validate,
            disabled: this.isDisabled(),
            className: this.classSet('inputGroup', styles.textarea),
            value: this.props.value || '',
            placeholder: this.getPlaceholder(),
            style: this.props.style,
            onChange: this.props.onChange,
            onKeyDown: this.props.onKeyDown,
            onKeyUp: this.props.onKeyUp
        };
        
        const {DelayedOnChange} = this.props;
        
        return (
            <FormGroup valid={this.state.isValid} className={this.props.className}>
                {this.renderLabel()}
                <DelayedOnChange delay={this.props.delay}>
                    <textarea {...props}/>
                </DelayedOnChange>
                {this.renderDescription()}
                {this.renderValidationMessage()}
            </FormGroup>
        );
    }
});

export default Webiny.createComponent(Textarea, {modules: ['DelayedOnChange', 'FormGroup'], styles});