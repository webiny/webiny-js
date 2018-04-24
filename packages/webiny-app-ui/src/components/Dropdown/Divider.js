import React from "react";
import { createComponent } from "webiny-app";
import styles from "./styles.css?prefix=Dropdown";

class Divider extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return <li role="presentation" className={this.props.styles.divider} />;
    }
}

export default createComponent(Divider, { styles });
