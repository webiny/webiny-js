import React from "react";
import classSet from "classnames";
import { Component } from "webiny-client";
import styles from "../styles.scss?prefix=wui-modal";

@Component({ styles })
class Content extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { styles } = this.props;
        return (
            <div className={classSet(styles.content, this.props.className)}>
                {this.props.children}
            </div>
        );
    }
}

export default Content;
