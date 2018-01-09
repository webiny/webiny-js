import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Progress extends Webiny.Ui.Component {
}

Progress.defaultProps = {
    value: 0,
    renderer() {
        const {styles} = this.props;

        return (
            <div className={styles.wrapper}>
                <div className={styles.bar}>
                    <div
                        className={styles.barInner}
                        role="progressbar"
                        aria-valuenow={this.props.value}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        style={{width: this.props.value + '%'}}/>
                </div>
            </div>
        );
    }
};

export default Webiny.createComponent(Progress, {styles});