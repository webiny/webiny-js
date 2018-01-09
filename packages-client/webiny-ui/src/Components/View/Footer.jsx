import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './styles.css'

class Footer extends Webiny.Ui.Component {

}

Footer.defaultProps = {
    align: null,
    renderer() {
        const {styles} = this.props;

        const css = this.classSet(
            styles.panelFooter,
            this.props.align === 'right' ? 'text-right' : null,
            this.props.className
        );

        const {Panel} = this.props;

        return (
            <Panel.Footer className={css}>
                {this.props.children}
            </Panel.Footer>
        );
    }
};

export default Webiny.createComponent(Footer, {modules: ['Panel'], styles});