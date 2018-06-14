import React from 'react';
import { inject } from 'webiny-client';
import styles from './../styles.css?prefix=wui-view';

@inject({ styles })
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

export default HeaderRight;