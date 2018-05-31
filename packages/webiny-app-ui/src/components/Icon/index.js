import React from "react";
import classSet from "classnames";
import { createComponent } from "webiny-app";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import styles from "./styles.css?prefix=wui--icon";

class Icon extends React.Component {
    render() {
        const { styles, type, onClick, render, ...props } = this.props;

        if (render) {
            return render.call(this);
        }

        const typeClasses = {
            default: "",
            danger: styles.danger,
            success: styles.success,
            info: styles.info,
            warning: styles.warning
        };

        const iconProps = {
            className: classSet("icon", this.props.className),
            onClick,
            children: <FontAwesomeIcon {...props} className={typeClasses[type]} />
        };

        return React.createElement(this.props.element, iconProps);
    }
}

Icon.defaultProps = {
    border: false,
    className: "",
    mask: null,
    fixedWidth: false,
    flip: null,
    icon: null,
    listItem: false,
    pull: null,
    pulse: false,
    name: "",
    rotation: null,
    size: null,
    spin: false,
    symbol: false,
    transform: null,
    type: "default",
    element: "span"
};

export default createComponent(Icon, { styles });
