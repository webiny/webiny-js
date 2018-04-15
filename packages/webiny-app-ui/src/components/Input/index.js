import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-app";
import FormComponent from "./../FormComponent";
import styles from "./styles.css";

class Input extends React.Component {
    constructor(props) {
        super(props);

        this.focus = this.focus.bind(this);
    }

    onKeyDown({ event }) {
        if (event.metaKey || event.ctrlKey) {
            return;
        }

        switch (event.key) {
            case "Enter":
                if (this.props.onEnter && this.props.onEnter !== _.noop) {
                    event.preventDefault();
                    this.props.onEnter({ event, component: this });
                }
                break;
            default:
                break;
        }
    }

    focus() {
        this.dom.focus();
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { modules: { DelayedOnChange, Icon, FormGroup }, styles } = this.props;

        const props = {
            "data-on-enter": this.props.onEnter !== _.noop,
            onBlur: this.props.validate ? this.props.validate : this.props.onBlur,
            disabled: this.props.disabled,
            readOnly: this.props.readOnly,
            type: this.props.type,
            className: styles.input,
            value: this.props.value || "",
            placeholder: this.props.placeholder,
            onKeyUp: event => this.props.onKeyUp({ event, component: this }),
            onKeyDown: event =>
                (this.props.onKeyDown !== _.noop
                    ? this.props.onKeyDown
                    : this.onKeyDown.bind(this))({
                    event,
                    component: this
                }),
            onChange: this.props.onChange,
            autoFocus: this.props.autoFocus,
            ref: ref => {
                this.dom = ref;
                this.props.onRef(ref);
            }
        };

        let showValidationIcon = true;
        let addonLeft = "";
        if (this.props.addonLeft) {
            addonLeft = <span className={styles.addon}>{this.props.addonLeft}</span>;
            showValidationIcon = false;
        }

        let addonRight = "";
        if (this.props.addonRight) {
            addonRight = <span className={styles.addon}>{this.props.addonRight}</span>;
            showValidationIcon = false;
        }

        let wrapperClassName = this.props.wrapperClassName + " inputGroup";
        let iconLeft = "";
        if (this.props.iconLeft) {
            wrapperClassName += " " + styles.iconLeft;
            iconLeft = <Icon icon={this.props.iconLeft} />;
        }

        let iconRight = "";
        if (this.props.iconRight) {
            wrapperClassName += " " + styles.iconRight;
            iconRight = <Icon icon={this.props.iconRight} />;
        }

        return (
            <FormGroup
                ref={ref => (this.ref = ref)}
                valid={_.get(this.props, "validation.isValid", true)}
                className={this.props.className}
            >
                {this.props.renderLabel.call(this)}
                {this.props.renderInfo.call(this)}

                <div className={wrapperClassName}>
                    {iconLeft}
                    {addonLeft}
                    <DelayedOnChange delay={this.props.delay}>
                        <input {...props} />
                    </DelayedOnChange>
                    {addonRight}
                    {iconRight}
                    {showValidationIcon && this.props.renderValidationIcon.call(this)}
                </div>
                {this.props.renderDescription.call(this)}
                {this.props.renderValidationMessage.call(this)}
            </FormGroup>
        );
    }
}

Input.defaultProps = {
    delay: 400,
    onEnter: _.noop, // NOTE: only works if inside a Form
    onKeyDown: _.noop,
    onKeyUp: _.noop,
    onRef: _.noop,
    type: "text",
    autoFocus: null,
    addonLeft: null,
    addonRight: null,
    iconLeft: null,
    iconRight: null,
    wrapperClassName: "",
    renderValidationIcon() {
        if (!this.props.showValidationIcon || this.props.validation.isValid === null) {
            return null;
        }

        const { FormGroup } = this.props.modules;

        if (this.props.validation.isValid === true) {
            return <FormGroup.ValidationIcon />;
        }
        return <FormGroup.ValidationIcon error />;
    }
};

export default createComponent([Input, FormComponent], {
    modules: ["DelayedOnChange", "Icon", "FormGroup"],
    styles
});
