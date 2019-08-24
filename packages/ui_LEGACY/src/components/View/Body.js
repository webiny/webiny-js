import React from 'react';
import { inject } from 'webiny-app';
import classSet from "classnames";
import styles from "./styles.module.css";

@inject({ modules: ['Panel'], styles })
class Body extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { modules: { Panel }, styles } = this.props;

        const classes = classSet(
            styles.panelBody,
            {
                [styles.panelNoPadding]: this.props.noPadding,
                [styles.panelNoColor]: this.props.noColor
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
    noPadding: false,
    noColor: false,
};

export default Body;