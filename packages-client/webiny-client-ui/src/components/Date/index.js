import React from 'react';
import _ from 'lodash';
import { createComponent, i18n } from 'webiny-client';
import { FormComponent } from 'webiny-client-ui';

class Date extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};
        this.valueChanged = false;
        this.element = null;

        this.setup = this.setup.bind(this);
        this.onChange = this.onChange.bind(this);
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
        if (prevState.isValid !== this.state.isValid) {
            this.input.setState({
                isValid: this.state.isValid,
                validationMessage: this.state.validationMessage
            });
        }
    }

    setup() {
        let format = this.props.inputFormat;

        this.element.datetimepicker({
            format: format,
            stepping: this.props.stepping,
            keepOpen: false,
            debug: this.props.debug || false,
            minDate: this.props.minDate ? new Date(this.props.minDate) : false,
            viewMode: this.props.viewMode,
            widgetPositioning: {
                horizontal: this.props.positionHorizontal,
                vertical: this.props.positionVertical
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
            const modelFormat = this.props.withTimezone ? 'Y-m-dTH:i:sO' : this.props.modelFormat;
            newValue = Webiny.I18n.datetime(newValue, modelFormat, this.props.inputFormat || Webiny.I18n.getDateFormat());
        }

        if (newValue !== this.props.value) {
            this.props.onChange(newValue, this.validate);
        }
    }

    renderPreview() {
        if (!_.isEmpty(this.props.value)) {
            return Webiny.I18n.date(this.props.value, this.props.inputFormat, this.props.modelFormat);
        }

        return this.getPlaceholder();
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const omitProps = ['attachToForm', 'attachValidators', 'detachFromForm', 'validateInput', 'form', 'renderer', 'name', 'onChange'];
        const props = _.omit(this.props, omitProps);
        const { Input, Icon } = props;
        props.value = this.renderPreview();
        props.addonRight = <Icon icon="icon-calendar"/>;
        props.onRef = element => {
            this.element = element;
            this.setup();
        };
        return <Input ref={ref => this.input = ref} {...props}/>;
    }
}

Date.defaultProps = {
    debug: false,
    inputFormat: null,
    modelFormat: 'Y-m-d',
    withTimezone: false,
    positionHorizontal: 'auto',
    positionVertical: 'bottom',
    viewMode: 'days'
};

export default createComponent([Date, FormComponent], {
    modules: ['Icon', 'Input', 'Vendors/DateTimePicker']
});
