import React from "react";
import _ from "lodash";
import { i18n, inject } from "webiny-client";
import { withFormComponent } from "webiny-client-ui";
import styles from "./styles.css?prefix=wui--date";

@withFormComponent()
@inject({
    modules: ["Icon", "InputLayout", { Flatpickr: "Vendor.FlatPickr" }]
})
class Date extends React.Component {
    constructor(props) {
        super(props);
        this.initialized = false;

        this.init = this.init.bind(this);
    }

    componentWillReceiveProps(props) {
        if (props.hasOwnProperty("value") && props.value !== this.props.value) {
            this.element.setDate(props.value, false);
        }
    }

    componentWillUnmount() {
        this.element.destroy();
    }

    init(element) {
        if (this.initialized) {
            return;
        }

        this.initialized = true;
        const options = _.assign(
            {
                defaultDate: this.props.value,
                formatDate: date => {
                    return i18n.date(date, this.getInputFormat());
                },
                onChange: values => {
                    let value = values[0];
                    if (value) {
                        value = i18n.date(value, this.getModelFormat());
                    }
                    this.props.onChange(value, this.validate);
                }
            },
            this.props.options
        );

        this.element = new this.props.modules.Flatpickr(element, options);
    }

    getInputFormat() {
        return this.props.inputFormat || i18n.getDateFormat();
    }

    getModelFormat() {
        return this.props.modelFormat;
    }

    getInputValue() {
        if (_.isEmpty(this.props.value)) {
            return "";
        }

        return i18n.date(this.props.value, this.getInputFormat(), this.getModelFormat());
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { InputLayout } = this.props.modules;

        const props = {
            onBlur: this.props.validate ? this.props.validate : this.props.onBlur,
            disabled: this.props.disabled,
            readOnly: this.props.readOnly,
            type: "text",
            placeholder: this.props.placeholder,
            onChange: this.props.onChange,
            autoFocus: this.props.autoFocus,
            className: styles.input,
            ref: ref => {
                this.init(ref);
                this.props.onRef(ref);
            }
        };

        return (
            <InputLayout
                iconRight="calendar-alt"
                valid={this.state.isValid}
                className={this.props.className}
                input={<input {...props} />}
                label={this.props.renderLabel.call(this)}
                description={this.props.renderDescription.call(this)}
                info={this.props.renderInfo.call(this)}
                validationMessage={this.props.renderValidationMessage.call(this)}
            />
        );
    }
}

Date.defaultProps = {
    onRef: _.noop,
    inputFormat: null,
    modelFormat: "YYYY-MM-DD",
    options: null
};

export default Date;
