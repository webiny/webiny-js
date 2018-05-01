import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-app";
import styles from "./styles.css?prefix=Webiny_Ui_InputLayout";

class InputLayout extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ...props.initialState
        };
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

    render() {
        const { Icon, FormGroup } = this.props.modules;

        let addonLeft = "";
        if (this.props.addonLeft) {
            addonLeft = <span className={styles.addon}>{this.props.addonLeft}</span>;
        }

        let addonRight = "";
        if (this.props.addonRight) {
            addonRight = <span className={styles.addon}>{this.props.addonRight}</span>;
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
            <FormGroup valid={this.props.valid} className={this.props.className}>
                {this.props.label}
                {this.props.info}

                <div className={wrapperClassName}>
                    {iconLeft}
                    {addonLeft}
                    {this.props.input}
                    {addonRight}
                    {iconRight}
                </div>

                {this.props.description}
                {this.props.validationMessage}
            </FormGroup>
        );
    }
}

InputLayout.defaultProps = {
    type: "text",
    autoFocus: null,
    addonLeft: null,
    addonRight: null,
    iconLeft: null,
    iconRight: null,
    wrapperClassName: "",
    valid: null,
    label: null,
    info: null,
    description: null,
    validationMessage: null,
    input: null
};

export default createComponent(InputLayout, {
    modules: ["Icon", "FormGroup"],
    styles
});
