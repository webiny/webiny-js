import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './../styles.css';

class Required extends Webiny.Ui.Component {

}

Required.defaultProps = {
    renderer() {
        return <span className={styles.mandat}>*</span>;
    }
};

export default Required;