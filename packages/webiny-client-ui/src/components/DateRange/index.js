import React from "react";
import _ from "lodash";
import { i18n, Component } from "webiny-client";
import { withFormComponent } from "webiny-client-ui";
import styles from "./styles.css?prefix=Webiny_Ui_DateRange";

@withFormComponent()
@Component({
    modules: ["Icon", "InputLayout", { Flatpickr: "Vendor.FlatPickr" }]
})
class Date extends React.Component {
    constructor(props) {
        super(props);
        this.initialized = false;
        this.element = null;
        this.id = _.uniqueId("dateRange");

        this.init = this.init.bind(this);
    }

    componentWillUnmount() {
        this.element.destroy();
    }

    componentWillReceiveProps(props) {
        if (props.hasOwnProperty("value") && props.value !== this.props.value) {
            this.element.setDate(props.value, false);
        }
    }

    init(element) {
        if (this.initialized) {
            return;
        }

        this.initialized = true;

        const options = _.assign(
            {
                defaultDate: this.props.value,
                mode: "range",
                formatDate: date => {
                    return i18n.date(date, this.getInputFormat());
                },
                onChange: values => {
                    const formatted = values.map(value => {
                        return i18n.date(value, this.getModelFormat());
                    });

                    this.props.onChange(formatted, this.validate);
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

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { InputLayout } = this.props.modules;

        const props = {
            onBlur: this.props.validate ? this.props.validate : this.props.onBlur,
            disabled: this.props.isDisabled(),
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
