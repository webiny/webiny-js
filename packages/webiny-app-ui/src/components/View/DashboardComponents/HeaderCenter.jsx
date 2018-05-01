import React from 'react';
import { createComponent } from 'webiny-app';
import styles from './../styles.css?prefix=Webiny_Ui_View';

class HeaderCenter extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { styles, children } = this.props;

        return (
            <div className={styles.dashboardHeaderCenter}>{children}</div>
        );
    }
}

export default createComponent(HeaderCenter, { styles });