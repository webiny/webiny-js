import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Footer extends Webiny.Ui.Component {

}

Footer.defaultProps = {
    style: {},
    renderer() {
        const classes = this.classSet(this.props.styles.footer, this.props.className);
        return <div className={classes} style={this.props.style}>{this.props.children}</div>;
    }
};

export default Webiny.createComponent(Footer, {styles});