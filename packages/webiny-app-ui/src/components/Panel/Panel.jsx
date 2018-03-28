import React from 'react';
import classSet from "classnames";
import { createComponent } from 'webiny-app';
import styles from './styles.css';

class Panel extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const classes = classSet(this.props.styles.panel, this.props.className);
        return <div className={classes}>{this.props.children}</div>;
    }
}

export default createComponent(Panel, { styles });