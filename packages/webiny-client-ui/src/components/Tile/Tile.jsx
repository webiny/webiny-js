import React from 'react';
import classSet from "classnames";
import { inject } from 'webiny-client';
import styles from "./styles.module.css";

@inject({ styles })
class Tile extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { type, styles, className, children } = this.props;

        const typeClasses = {
            default: styles.default,
            primary: styles.primary,
            success: styles.success
        };

        const classes = classSet(
            styles.tile,
            className,
            typeClasses[type]
        );

        return <div className={classes}>{children}</div>;
    }
}

Tile.defaultProps = {
    className: null,
    type: 'default'
};

export default Tile;
