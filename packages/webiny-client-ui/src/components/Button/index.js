import React from "react";
import _ from "lodash";
import { inject } from "webiny-client";
import classSet from "classnames";
import styles from "./styles.module.css";

@inject({ styles, modules: ["Tooltip", "Icon"] })
class Button extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            enabled: true
        };
    }

    disable() {
        this.setState({ enabled: false });
    }

    enable() {
        this.setState({ enabled: true });
    }

    render() {
        const { render, ...props } = this.props;
        if (render) {
            return render.call(this);
        }

        const {
            modules: { Tooltip, Icon },
            styles
        } = props;

        if (props.disabled || !this.state.enabled) {
            props["disabled"] = true;
        }

        const sizeClasses = {
            normal: "",
            large: styles.btnLarge
            //small: 'btn-sm' // sven: this option doesn't exist in css
        };

        const alignClasses = {
            normal: "",
            left: "pull-left",
            right: "pull-right"
        };

        const typeClasses = {
            default: styles.btnDefault,
            primary: styles.btnPrimary,
            secondary: styles.btnSuccess
        };

        const classes = classSet(
            sizeClasses[props.size],
            alignClasses[props.align],
            typeClasses[props.type],
            props.className
        );

        const icon = this.props.icon ? (
            <Icon icon={this.props.icon} className={styles.icon + " " + styles.iconRight} />
        ) : null;
        let content = props.children || props.label;
        if (icon) {
            content = <span>{content}</span>;
        }

        const buttonProps = _.pick(props, ["style", "disabled"]);
        buttonProps.onClick = e => this.props.onClick({ event: e });
        _.assign(buttonProps, {
            type: "button",
            className: classes,
            ref: this.props.onRef
        });
        let button = (
            <button {...buttonProps}>
                {icon} {content}
            </button>
        );

        if (this.props.tooltip) {
            button = (
                <Tooltip target={button} placement="top">
                    {this.props.tooltip}
                </Tooltip>
            );
        }

        return button;
    }
}

Button.defaultProps = {
    size: "normal",
    type: "default",
    align: "normal",
    icon: null,
    className: null,
    style: null,
    label: null,
    onClick: _.noop,
    tooltip: null,
    disabled: false,
    onRef: _.noop
};

export default Button;
