import React from "react";
import classSet from "classnames";
import { createComponent } from "webiny-app";
import styles from "./styles.css";

class Loader extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { styles } = this.props;
        return (
            <div
                className={classSet(styles.overlay, this.props.className)}
                style={this.props.style}
            >
                <div className={styles.iconWrapper}>
                    <div className={styles.icon} />
                    {this.props.children ? (
                        <loader-content>{this.props.children}</loader-content>
                    ) : null}
                </div>
            </div>
        );
    }
}

Loader.defaultProps = {
    className: null,
    style: null
};

export default createComponent(Loader, { styles });
