import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class CheckboxGroup extends Webiny.Ui.OptionComponent {
    constructor(props) {
        super(props);

        this.bindMethods('renderOptions,onChange');
    }

    onChange(key, newValue) {
        const option = this.state.options[key];
        const newState = this.props.value || [];
        if (newValue) {
            newValue = this.props.formatOptionValue({value: this.props.useDataAsValue ? option.data : option.id});
            newState.push(newValue);
        } else {
            const currentIndex = _.findIndex(newState, opt => {
                const optValue = this.props.valueKey ? _.get(opt, this.props.valueKey) : opt;
                return optValue === option.id;
            });

            newState.splice(currentIndex, 1);
        }
        this.props.onChange(newState, this.validate);
    }

    /**
     * Create options elements
     *
     * Callback parameter is used when you need to implement a custom renderer and optionally wrap each option element with custom markup
     *
     * @returns {Array}
     */
    renderOptions(callback = null) {
        const {Checkbox} = this.props;
        return this.state.options.map((item, key) => {
            const checked = _.find(this.props.value, opt => {
                if (_.isPlainObject(opt)) {
                    return _.get(opt, this.props.valueKey) === item.id;
                }
                return opt === item.id;
            });

            const props = {
                key, // React key
                label: item.text,
                disabled: this.isDisabled(),
                value: checked, // true/false
                onChange: this.onChange,
                option: item,
                optionIndex: key
            };

            if (_.isFunction(this.props.checkboxRenderer)) {
                props.renderer = this.props.checkboxRenderer;
            }

            if (_.isFunction(this.props.checkboxLabelRenderer)) {
                props.labelRenderer = this.props.checkboxLabelRenderer;
            }
            const checkbox = <Checkbox {...props}/>;

            if (callback) {
                return callback(checkbox, key);
            }

            return checkbox;
        });
    }
}

CheckboxGroup.defaultProps = Webiny.Ui.OptionComponent.extendProps({
    checkboxRenderer: null,
    checkboxLabelRenderer: null,
    formatOptionValue: ({value}) => value,
    renderer() {
        const {FormGroup, styles} = this.props;

        return (
            <FormGroup valid={this.state.isValid} className={this.props.className}>
                {this.renderLabel()}
                <div className="clearfix"/>
                <div className={'inputGroup ' + (this.props.disabled && styles.disabled)}>
                    {this.renderOptions()}
                </div>
                {this.renderValidationMessage()}
            </FormGroup>
        );
    }
});

export default Webiny.createComponent(CheckboxGroup, {styles, modules: ['Checkbox', 'FormGroup']});