import React from "react";
import { createComponent } from "webiny-app";
import classSet from "classnames";
import styles from "./../styles.css?prefix=wui-formGroup";

class ValidationMessage extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const {
            modules: { Animate },
            children,
            show
        } = this.props;

        let css = show ? styles.validationMessageError : null;

        return (
            <Animate
                trigger={show}
                mountOnEnter
                unmountOnExit
                enterAnimation={this.props.showValidationAnimation}
                exitAnimation={this.props.hideValidationAnimation}
            >
                {({ ref }) => (
                    <div className={styles.validationMessageHolder}>
                        <span ref={ref} className={classSet(styles.validationMessage, css)}>
                            {children}
                        </span>
                    </div>
                )}
            </Animate>
        );
    }
}

ValidationMessage.defaultProps = {
    show: false,
    showValidationAnimation: { type: "easeIn", translateY: 50, opacity: 1, duration: 225 },
    hideValidationAnimation: { type: "easeOut", translateY: 0, opacity: 0, duration: 225 }
};

export default createComponent(ValidationMessage, { modules: ["Animate"], styles });
