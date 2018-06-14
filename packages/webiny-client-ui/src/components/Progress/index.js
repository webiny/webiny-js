import React from "react";
import { Component } from "webiny-client";
import styles from "./styles.css?prefix=Webiny_Ui_Progress";

@Component({ styles })
class Progress extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { styles, value } = this.props;

        return (
            <div className={styles.wrapper}>
                <div className={styles.bar}>
                    <div
                        className={styles.barInner}
                        role="progressbar"
                        aria-valuenow={value}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        style={{ width: value + "%" }}
                    />
                </div>
            </div>
        );
    }
}

Progress.defaultProps = {
    value: 0
};

export default Progress;
