import React from "react";
import _ from "lodash";
import { i18n, Component } from "webiny-client";
import { withFormComponent } from "webiny-client-ui";
import styles from "./styles.css?prefix=Webiny_Ui_Time";

@withFormComponent()
@Component({
    modules: ["Icon", "InputLayout", { Flatpickr: "Vendor.FlatPickr" }]
})
class Time extends React.Component {
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
                enableTime: true,
                noCalendar: true,
                time_24hr: true,
                formatDate: date => {
                    return i18n.time(date, this.getInputFormat());
                },
                onChange: values => {
                    let value = values[0];
                    if (value) {
                        value = i18n.time(value, this.getModelFormat());
                    }
                    this.props.onChange(value, this.validate);
                }
            },
            this.props.options
        );

        this.element = new this.props.modules.Flatpickr(element, options);
    }

    getInputFormat() {
        return this.props.inputFormat || i18n.getTimeFormat();
    }

    getModelFormat() {
        return this.props.modelFormat;
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
                iconRight="clock"
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

Time.defaultProps = {
    onRef: _.noop,
    inputFormat: null,
    modelFormat: "HH:mm",
    options: null
};

export default Time;
