import React from 'react';
import {Webiny} from 'webiny-client';
import styles from '../styles.css';

class Footer extends Webiny.Ui.Component {

}

Footer.defaultProps = {
    renderer() {
        return (
            <div className={this.classSet(styles.footer, this.props.className)}>{this.props.children}</div>
        );
    }
};

export default Webiny.createComponent(Footer, {styles});