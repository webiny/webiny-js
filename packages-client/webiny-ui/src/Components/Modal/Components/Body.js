import React from 'react';
import {Webiny} from 'webiny-client';
import styles from '../styles.css';

class Body extends Webiny.Ui.Component {

}

Body.defaultProps = {
    noPadding: false,
    style: null,
    renderer() {
        const {styles, style} = this.props;
        return (
            <div style={style} className={this.classSet(styles.body, (this.props.noPadding && styles.noPadding), this.props.className)}>
                {this.props.children}
            </div>
        );
    }
};

export default Webiny.createComponent(Body, {styles});