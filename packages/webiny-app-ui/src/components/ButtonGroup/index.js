import React from "react";
import { createComponent } from "webiny-app";
import classSet from "classnames";
import styles from "./styles.scss";

class ButtonGroup extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { styles, className } = this.props;
        return <div className={classSet(styles.btnGroup, className)}>{this.props.children}</div>;
    }
}

export default createComponent(ButtonGroup, { styles });
