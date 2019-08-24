import React from 'react';
import { inject } from 'webiny-app';
import styles from "./../styles.module.css";

@inject({ styles })
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

export default HeaderCenter;