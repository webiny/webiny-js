import React from "react";
import classSet from "classnames";
import { inject } from "webiny-client";
import styles from "../styles.module.scss";

@inject({ styles })
class Footer extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return (
            <div className={classSet(styles.footer, this.props.className)}>
                {this.props.children}
            </div>
        );
    }
}

export default Footer;
