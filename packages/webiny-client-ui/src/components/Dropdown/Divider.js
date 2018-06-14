import React from "react";
import { inject } from "webiny-client";
import styles from "./styles.scss?prefix=wui-dropdown";

@inject({ styles })
class Divider extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return <li role="presentation" className={this.props.styles.divider} />;
    }
}

export default Divider;
