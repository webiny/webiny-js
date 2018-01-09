import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './../styles.css';

class InfoMessage extends Webiny.Ui.Component {

}

InfoMessage.defaultProps = {
    renderer() {
        return <span className={styles.infoMessage}>{this.props.children}</span>;
    }
};

export default InfoMessage;