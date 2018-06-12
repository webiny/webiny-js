import React from 'react';
import classSet from "classnames";
import { createComponent } from 'webiny-client';
import styles from './styles.css?prefix=Webiny_Ui_Tile_Body';

class Body extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { styles, className, children, style } = this.props;

        return (
            <div style={style} className={classSet(styles.content, className)}>{children}</div>
        );
    }
}

export default createComponent(Body, { styles });