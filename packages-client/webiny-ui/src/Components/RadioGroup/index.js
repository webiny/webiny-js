import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import Radio from './Radio';
import styles from './styles.css';

class RadioGroup extends Webiny.Ui.OptionComponent {
    constructor(props) {
        super(props);

        this.bindMethods('renderOptions');
    }

    shouldComponentUpdate(nextProps, nextState) {
        const propsChanged = !_.isEqual(nextProps.options, this.props.options) || !_.isEqual(nextProps.value, this.props.value);
        const stateChanged = !_.isEqual(nextState.options, this.state.options);
        return propsChanged || stateChanged;
    }

    /**
     * Render options elements
     *
     * Callback parameter is used when you need to implement a custom renderer and optionally wrap each option element with custom markup
     *
     * @returns {Array}
     */
    renderOptions(callback = null) {
        return this.state.options.map((item, key) => {
            let checked = false;
            if (_.isPlainObject(this.props.value)) {
                // If value is an object we need to fetch a single value to compare against option id.
                // `valueKey` should be used for this purpose but we also use `valueAttr` as a fallback
                // (although `valueAttr` should only be used for generating options, it contains the default identification attribute name)
                checked = _.get(this.props.value, this.props.valueKey || this.props.valueAttr) === item.id;
            } else {
                checked = this.props.value === item.id;
            }

            const props = {
                key,
                label: item.text,
                disabled: this.isDisabled(),
                option: item,
                optionIndex: key,
                value: checked,
                onChange: newValue => {
                    this.props.onChange(this.props.useDataAsValue ? newValue.data : newValue.id, this.validate);
                }
            };

            if (this.props.radioRenderer) {
                props.renderer = this.props.radioRenderer;
            }

            if (this.props.radioLabelRenderer) {
                props.labelRenderer = this.props.radioLabelRenderer;
            }

            const radio = <Radio {...props}/>;

            if (callback) {
                return callback(radio, key);
            }

            return radio;
        });
    }
}

RadioGroup.Radio = Radio;

RadioGroup.defaultProps = Webiny.Ui.OptionComponent.extendProps({
    radioLabelRenderer: null,
    radioRenderer: null,
    renderer() {
        const {FormGroup, styles} = this.props;

        return (
            <FormGroup className={this.classSet(this.props.className, (this.props.disabled && styles.disabled))}>
                {this.renderLabel()}
                <div className="clearfix"/>
                {this.renderOptions()}
                {this.renderValidationMessage()}
            </FormGroup>
        );
    }
});

export default Webiny.createComponent(RadioGroup, {modules: ['FormGroup'], styles});