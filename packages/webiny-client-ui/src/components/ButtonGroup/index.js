import React from "react";
import { inject } from "webiny-client";
import classSet from "classnames";
import styles from "./styles.scss?prefix=Webiny_Ui_ButtonGroup";

@inject({ styles })
class ButtonGroup extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { styles, className, children } = this.props;
        return <div className={classSet(styles.btnGroup, className)}>{children}</div>;
    }
}

export default ButtonGroup;
