import React from "react";
import styles from "./../styles.css?prefix=Webiny_Ui_FormGroup";

class DescriptionMessage extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return <span className={styles.descriptionMessage}>{this.props.children}</span>;
    }
}

export default DescriptionMessage;
