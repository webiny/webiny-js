import React from "react";
import styles from "./../styles.css?prefix=wui-formGroup";

class ValidationIcon extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        let css = styles.validationIconSuccess;
        if (this.props.error) {
            css = styles.validationIconError;
        }

        return <span className={css} />;
    }
}

ValidationIcon.defaultProps = {
    error: false
};

export default ValidationIcon;
