import React from 'react';
import { Component } from 'webiny-client';
import styles from './../styles.css?prefix=wui-view';

@Component({ styles })
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