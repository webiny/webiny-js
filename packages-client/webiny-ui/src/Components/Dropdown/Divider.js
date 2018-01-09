import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Divider extends Webiny.Ui.Component {

}

Divider.defaultProps = {
    renderer() {
        const {styles} = this.props;
        return <li role="presentation" className={styles.divider}/>;
    }
};

export default Webiny.createComponent(Divider, {styles});
