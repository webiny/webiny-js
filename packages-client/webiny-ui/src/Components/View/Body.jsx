import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Body extends Webiny.Ui.Component {

}

Body.defaultProps = {
    noPadding: false,
    renderer() {
        const {Panel, styles} = this.props;

        const classSet = this.classSet(
            styles.panelBody,
            {
                [styles.panelNoPadding]: this.props.noPadding
            }
        );

        return (
            <Panel.Body className={classSet}>
                {this.props.children}
            </Panel.Body>
        );
    }
};

export default Webiny.createComponent(Body, {modules: ['Panel'], styles});