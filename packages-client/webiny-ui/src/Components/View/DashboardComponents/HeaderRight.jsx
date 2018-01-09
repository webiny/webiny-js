import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './../styles.css';

class HeaderRight extends Webiny.Ui.Component {

}

HeaderRight.defaultProps = {
    renderer() {
        const {styles} = this.props;

        return (
            <div className={styles.dashboardHeaderRight}>
                {this.props.children}
            </div>
        );
    }
};

export default Webiny.createComponent(HeaderRight, {styles});