import React from 'react';
import { createComponent } from 'webiny-app';
import styles from './../styles.css?prefix=Webiny_Ui_View';

class HeaderRight extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { styles } = this.props;

        return (
            <div className={styles.dashboardHeaderRight}>
                {this.props.children}
            </div>
        );
    }
}

export default createComponent(HeaderRight, { styles });