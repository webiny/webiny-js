import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './../styles.css';

class HeaderCenter extends Webiny.Ui.Component {

}

HeaderCenter.defaultProps = {
    renderer() {
        const {styles} = this.props;

        return (
            <div className={styles.dashboardHeaderCenter}>
                {this.props.children}
            </div>
        );
    }
};

export default Webiny.createComponent(HeaderCenter, {styles});