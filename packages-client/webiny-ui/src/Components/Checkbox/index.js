import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Checkbox extends Webiny.Ui.FormComponent {

    constructor(props) {
        super(props);
        this.id = _.uniqueId('checkbox-');
        this.bindMethods('onChange,isChecked');
    }

    onChange(e, value = e.target.checked) {
        if (this.props.optionIndex !== null) {
            this.props.onChange(this.props.optionIndex, value);
        } else {
            const callback = this.props.validate ? this.validate : _.noop;
            this.props.onChange(e.target.checked, callback);
        }
    }

    isChecked() {
        const {value} = this.props;
        return !_.isNull(value) && value !== false && value !== undefined;
    }

    renderLabel() {
        return this.props.labelRenderer.call(this, {option: this.props.option, checkbox: this});
    }
}

Checkbox.defaultProps = Webiny.Ui.FormComponent.extendProps({
    label: '',
    className: null,
    style: null,
    option: null,
    optionIndex: null,
    labelRenderer() {
        let tooltip = null;
        if (this.props.tooltip) {
            tooltip = (
                <Webiny.Ui.LazyLoad modules={['Tooltip', 'Icon']}>
                    {(Ui) => (
                        <Ui.Tooltip key="label" target={<Ui.Icon icon="icon-info-circle"/>}>{this.props.tooltip}</Ui.Tooltip>
                    )}
                </Webiny.Ui.LazyLoad>
            );
        }
        return <span>{this.props.label} {tooltip}</span>;
    },
    renderer() {
        const {styles} = this.props;
        const css = this.classSet(
            styles.checkbox,
            this.isDisabled() && styles.checkboxDisabled,
            this.props.className
        );

        const checkboxProps = {
            disabled: this.isDisabled(),
            onChange: this.onChange,
            checked: this.isChecked()
        };

        return (
            <div className={css} style={this.props.style}>
                <input id={this.id} type="checkbox" {...checkboxProps}/>
                <label htmlFor={this.id}>{this.renderLabel()}</label>
                {this.renderValidationMessage()}
            </div>
        );
    }
});

export default Webiny.createComponent(Checkbox, {styles});