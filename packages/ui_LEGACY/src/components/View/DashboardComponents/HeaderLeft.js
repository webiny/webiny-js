import React from 'react';
import { inject } from 'webiny-app';
import classSet from 'classnames';
import styles from "./../styles.module.css";

@inject({ styles })
class HeaderLeft extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }
        const { styles } = this.props;

        return (
            <div className={classSet(styles.dashboardHeaderLeft, styles.titleWrapper)}>
                <h2 className={styles.titleContent}>
                    {this.props.title}
                </h2>
                <div className={styles.titleDescription}>{this.props.description}</div>
            </div>
        );
    }
}

HeaderLeft.defaultProps = {
    title: null,
    description: null
};

export default HeaderLeft;