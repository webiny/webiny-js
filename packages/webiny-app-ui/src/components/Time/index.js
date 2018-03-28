import React from 'react';
import _ from 'lodash';
import $ from 'jquery';
import { Webiny } from 'webiny-app';

class Time extends Webiny.Ui.FormComponent {
    constructor(props) {
        super(props);
        this.valueChanged = false;

        this.bindMethods('setup,onChange');
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps['disabledBy']) {
            return true;
        }

        const omit = ['children', 'key', 'ref', 'onChange'];
        const oldProps = _.omit(this.props, omit);
        const newProps = _.omit(nextProps, omit);

        return !_.isEqual(newProps, oldProps) || !_.isEqual(nextState, this.state);
    }

    componentDidUpdate(prevProps, prevState) {
        super.componentDidUpdate();
        if (prevState.isValid !== this.state.isValid) {
            this.input.setState({
                isValid: this.state.isValid,
                validationMessage: this.state.validationMessage
            });
        }
    }

    setup() {
        this.element = $(this.dom);

        let format = this.props.inputFormat || Webiny.I18n.getTimeFormat();
        format = Webiny.I18n.convertPhpToJsDateTimeFormat(format);

        this.element.datetimepicker({
            format,
            stepping: this.props.stepping,
            keepOpen: false,
            debug: this.props.debug || false,
            minDate: this.props.minDate ? new Date(this.props.minDate) : false,
            widgetPositioning: {
                horizontal: this.props.positionHorizontal || 'auto',
                vertical: this.props.positionVertical || 'bottom'
            }
        }).on('dp.hide', e => {
            if (this.valueChanged) {
                this.onChange(e.target.value);
            }
            this.valueChanged = false;
        }).on('dp.change', () => {
            this.valueChanged = true;
        });
    }

    onChange(newValue) {
        if (newValue) {
            newValue = Webiny.I18n.time(newValue, this.props.modelFormat, this.props.inputFormat || Webiny.I18n.getTimeFormat());
        }

        if (newValue !== this.props.value) {
            this.props.onChange(newValue, this.validate);
        }
    }

    renderPreview() {
        if (!_.isEmpty(this.props.value)) {
            return Webiny.I18n.time(this.props.value, this.props.inputFormat, this.props.modelFormat);
        }

        return this.getPlaceholder();
    }
}

Time.defaultProps = {
    onChange: _.noop,
    debug: false,
    disabled: false,
    readOnly: false,
    placeholder: '',
    inputFormat: null,
    modelFormat: 'H:i:s',
    stepping: 15,
    renderer() {
        const omitProps = ['attachToForm', 'attachValidators', 'detachFromForm', 'validateInput', 'form', 'renderer', 'name', 'onChange'];
        const props = _.omit(this.props, omitProps);
        const { Input, Icon } = props;
        props.value = this.renderPreview();
        props.addonRight = <Icon icon="icon-calendar"/>;
        props.onRef = input => {
            this.dom = input;
            this.setup();
        };

        return <Input ref={ref => this.input = ref} {...props}/>;
    }
};

export default Webiny.createComponent(Time, {
    modules: ['Icon', 'Input', 'Webiny/Vendors/DateTimePicker']
});
