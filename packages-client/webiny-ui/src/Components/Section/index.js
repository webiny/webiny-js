import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Section extends Webiny.Ui.Component {

}

Section.defaultProps = {
    title: null,
    icon: null,
    renderer() {
        const {Icon, styles} = this.props;
        let icon = null;
        if (this.props.icon) {
            icon = <Icon icon={this.props.icon}/>;
        }

        return (
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <h5 className={styles.title}>{icon} {this.props.title}</h5>
                    {_.size(this.props.children) > 0 && <div className={styles.container}>{this.props.children}</div>}
                </div>
            </div>
        );
    }
};

export default Webiny.createComponent(Section, {modules: ['Icon'], styles});
