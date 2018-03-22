import React from 'react';
import _ from 'lodash';
import classSet from "classnames";
import { createComponent } from 'webiny-client';
import { OptionComponent } from 'webiny-client-ui';
import Radio from './Radio';
import styles from './styles.css';

class RadioGroup extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.initialState
        };

        this.renderOptions = this.renderOptions.bind(this);
    }

    componentDidMount() {
        if (this.props.attachToForm) {
            this.props.attachToForm(this);
        }
    }

    shouldComponentUpdate(nextProps) {
        return !_.isEqual(nextProps.options, this.props.options) || !_.isEqual(nextProps.value, this.props.value);
    }

    /**
     * Render options elements
     *
     * Callback parameter is used when you need to implement a custom render and optionally wrap each option element with custom markup
     *
     * @returns {Array}
     */
    renderOptions(callback = null) {
        return this.props.options.map((item, key) => {
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
                disabled: this.props.isDisabled(),
                option: item,
                optionIndex: key,
                value: checked,
                onChange: newValue => {
                    this.props.onChange(this.props.useDataAsValue ? newValue.data : newValue.id, this.validate);
                }
            };

            if (this.props.renderRadio) {
                props.render = this.props.renderRadio;
            }

            if (this.props.renderRadioLabel) {
                props.renderLabel = this.props.renderRadioLabel;
            }

            const radio = <Radio {...props}/>;

            if (callback) {
                return callback(radio, key);
            }

            return radio;
        });
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { FormGroup, styles, className, disabled } = this.props;

        return (
            <FormGroup className={classSet(className, (disabled && styles.disabled))}>
                {this.props.renderLabel.call(this)}
                <div className="clearfix"/>
                {this.renderOptions()}
                {this.props.renderValidationMessage.call(this)}
            </FormGroup>
        );
    }

}

RadioGroup.Radio = Radio;

RadioGroup.defaultProps = {
    renderRadioLabel: null,
    renderRadio: null
};

export default createComponent([RadioGroup, OptionComponent], { modules: ['FormGroup'], styles, formComponent: true });