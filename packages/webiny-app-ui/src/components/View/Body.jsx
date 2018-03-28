import React from 'react';
import { createComponent } from 'webiny-app';
import classSet from "classnames";
import styles from './styles.css';

class Body extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { Panel, styles } = this.props;

        const classes = classSet(
            styles.panelBody,
            {
                [styles.panelNoPadding]: this.props.noPadding
            }
        );

        return (
            <Panel.Body className={classes}>
                {this.props.children}
            </Panel.Body>
        );
    }
}

Body.defaultProps = {
    noPadding: false
};

export default createComponent(Body, { modules: ['Panel'], styles });