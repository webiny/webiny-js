import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-app";
import classSet from "classnames";
import AlertContainer from "./Container";
import styles from "./styles.css?prefix=Alert";

class Alert extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { styles, type, onClose, modules: { Icon } } = this.props;

        const typeClasses = {
            info: styles.alertInfo,
            success: styles.alertSuccess,
            warning: styles.alertWarning,
            error: styles.alertDanger,
            danger: styles.alertDanger
        };

        const iconClasses = {
            info: ["fas", "info-circle"],
            success: ["fas", "check-circle"],
            warning: ["fas", "exclamation-circle"],
            error: ["fas", "times"],
            danger: ["fas", "times"]
        };

        const classes = classSet(typeClasses[type], this.props.className);

        let icon = null;
        if (this.props.icon) {
            icon = <Icon icon={this.props.icon} />;
        } else {
            icon = <Icon icon={iconClasses[type]} />;
        }

        const title = this.props.title ? <strong>{this.props.title}:</strong> : null;

        return (
            <AlertContainer onClose={onClose}>
                {close => (
                    <div className={classes}>
                        {icon}
                        {this.props.close && (
                            <button type="button" className={styles.close} onClick={close}>
                                <span aria-hidden="true">×</span>
                            </button>
                        )}
                        {title} {this.props.children}
                    </div>
                )}
            </AlertContainer>
        );
    }
}

Alert.defaultProps = {
    type: "info",
    icon: null,
    title: null,
    close: false,
    onClose: _.noop,
    className: null
};

export default createComponent(Alert, { styles, modules: ["Icon"] });
