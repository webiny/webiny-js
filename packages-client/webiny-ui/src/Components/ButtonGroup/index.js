import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './styles.scss';

class ButtonGroup extends Webiny.Ui.Component {

}

ButtonGroup.defaultProps = {
    className: null,
    renderer() {
        const {styles, className} = this.props;
        return (
          <div className={this.classSet(styles.btnGroup, className)}>
              {this.props.children}
          </div>
        );
    }
};

export default Webiny.createComponent(ButtonGroup, {styles});
