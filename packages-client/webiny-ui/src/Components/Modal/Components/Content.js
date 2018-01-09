import React from 'react';
import {Webiny} from 'webiny-client';
import styles from '../styles.css';

class Content extends Webiny.Ui.Component {

}

Content.defaultProps = {
    renderer() {
        const {styles} = this.props;
        return (
            <div className={this.classSet(styles.content, this.props.className)}>
                {this.props.children}
            </div>
        );
    }
};

export default Webiny.createComponent(Content, {styles});

