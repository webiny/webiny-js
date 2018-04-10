import React from "react";
import _ from "lodash";
import { i18n, createComponent } from "webiny-app";
import { FormComponent } from "webiny-app-ui";
import styles from "./styles.css";

class Date extends React.Component {
    constructor(props) {
        super(props);
        this.initialized = false;
        this.state = {
            ...props.initialState
        };

        this.init = this.init.bind(this);
    }

    componentDidMount() {
        this.props.attachToForm && this.props.attachToForm(this);
    }

    init(element) {
        if (this.initialized) {
            return;
        }

        this.initialized = true;
        element.flatpickr({
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
        });
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
            disabled: this.props.isDisabled(),
            readOnly: this.props.readOnly,
            type: "text",
            value: this.getInputValue(),
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
                iconRight="icon-calendar"
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
    modelFormat: "YYYY-MM-DD"
};

export default createComponent([Date, FormComponent], {
    modulesProp: "modules",
    modules: ["Icon", "InputLayout", { flatpickr: "Vendor.FlatPickr" }],
    formComponent: true
});
