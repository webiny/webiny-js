import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Panel extends Webiny.Ui.Component {

}

Panel.defaultProps = {
    renderer() {
        const classes = this.classSet(this.props.styles.panel, this.props.className);
        return <div className={classes}>{this.props.children}</div>;
    }
};

export default Webiny.createComponent(Panel, {styles});