import React from "react";
import { createComponent } from "webiny-app";
import styles from "./WidgetHolder.scss";

class WidgetHolder extends React.Component {
    render() {
        return <div className={styles.editorWidgetHolder}>{this.props.children}</div>;
    }
}

export default createComponent(WidgetHolder);
