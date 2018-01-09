import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Body extends Webiny.Ui.Component {

}

Body.defaultProps = {
    style: null,
    renderer() {
        const classes = this.classSet(this.props.styles.body, this.props.className);
        return <div style={this.props.style} className={classes}>{this.props.children}</div>;
    }
};

export default Webiny.createComponent(Body, {styles});