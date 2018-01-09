import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Tile extends Webiny.Ui.Component {

}

Tile.defaultProps = {
    className: null,
    type: 'default',
    renderer() {
        const {styles} = this.props;

        const typeClasses = {
            default: styles.default,
            primary: styles.primary,
            success: styles.success
        };

        const classes = this.classSet(
            styles.tile,
            this.props.className,
            typeClasses[this.props.type]
        );

        return <div className={classes}>{this.props.children}</div>;
    }
};

export default Webiny.createComponent(Tile, {styles});
