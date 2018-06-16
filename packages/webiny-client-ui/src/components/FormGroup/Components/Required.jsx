import React from "react";
import styles from "./../styles.module.css";

class Required extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return <span className={styles.mandat}>*</span>;
    }
}

export default Required;
