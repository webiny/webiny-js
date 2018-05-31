import React from "react";
import styles from "./../styles.css?prefix=wui-formGroup";

class Required extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return <span className={styles.mandat}>*</span>;
    }
}

export default Required;
