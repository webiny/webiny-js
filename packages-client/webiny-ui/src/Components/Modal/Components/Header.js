import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from '../styles.css';

class Header extends Webiny.Ui.Component {

}

Header.defaultProps = {
    onClose: _.noop,
    renderer() {
        let headerContent = '';
        if (_.get(this.props, 'title') && this.props.title !== '') {
            headerContent = <h4>{this.props.title}</h4>;
        } else if (_.size(this.props.children) > 0) {
            headerContent = this.props.children;
        }

        return (
            <div className={this.classSet(styles.header, this.props.className)}>
                {headerContent}
                {this.props.onClose && this.props.onClose !== _.noop && (
                    <button onClick={this.props.onClose} type="button" className={styles.close} data-dismiss="modal">×</button>
                )}
            </div>
        );
    }
};

export default Webiny.createComponent(Header, {styles});