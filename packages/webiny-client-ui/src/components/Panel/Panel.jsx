import React from 'react';
import classSet from "classnames";
import { inject } from 'webiny-client';
import styles from "./styles.module.css";

@inject({ styles })
class Panel extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const classes = classSet(this.props.styles.panel, this.props.className);
        return <div className={classes}>{this.props.children}</div>;
    }
}

export default Panel;