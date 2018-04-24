import React from "react";
import _ from "lodash";
import classSet from "classnames";
import { createComponent } from "webiny-app";
import styles from "../styles.css?prefix=Modal";

class Header extends React.Component {
    render() {
        let headerContent = "";
        if (_.get(this.props, "title") && this.props.title !== "") {
            headerContent = <h4>{this.props.title}</h4>;
        } else if (_.size(this.props.children) > 0) {
            headerContent = this.props.children;
        }

        return (
            <div className={classSet(styles.header, this.props.className)}>
                {headerContent}
                {this.props.onClose &&
                    this.props.onClose !== _.noop && (
                        <button
                            onClick={this.props.onClose}
                            type="button"
                            className={styles.close}
                            data-dismiss="modal"
                        >
                            ×
                        </button>
                    )}
            </div>
        );
    }
}

Header.defaultProps = {
    onClose: _.noop
};

export default createComponent(Header, { styles });
