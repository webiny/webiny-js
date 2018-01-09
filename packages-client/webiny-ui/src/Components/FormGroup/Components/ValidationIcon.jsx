import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './../styles.css';

class ValidationIcon extends Webiny.Ui.Component {

}

ValidationIcon.defaultProps = {
    error: false,
    renderer() {

        let css = styles.validationIconSuccess;
        if (this.props.error) {
            css = styles.validationIconError;
        }

        return <span className={css}/>;
    }
};

export default ValidationIcon;