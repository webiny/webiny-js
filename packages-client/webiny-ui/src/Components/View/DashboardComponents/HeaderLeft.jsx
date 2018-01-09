import React from 'react';
import {Webiny} from 'webiny-client';
import _ from 'lodash';
import styles from './../styles.css';

class HeaderLeft extends Webiny.Ui.Component {

}

HeaderLeft.defaultProps = {
    title: null,
    description: null,
    renderer() {
        const {styles} = this.props;

        // extract the app name
        const appName = _.get(Webiny.Router.getActiveRoute(), 'module.app.name', '').split('.')[0];

        return (
            <div className={this.classSet(styles.dashboardHeaderLeft, styles.titleWrapper)}>
                <h2 className={styles.titleContent}>
                    <span className={styles.appName}>{appName}/</span>{this.props.title}
                </h2>
                <div className={styles.titleDescription}>{this.props.description}</div>
            </div>
        );
    }
};

export default Webiny.createComponent(HeaderLeft, {styles});