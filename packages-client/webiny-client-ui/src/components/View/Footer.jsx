import React from 'react';
import { createComponent } from 'webiny-client';
import styles from './styles.css'
import classSet from "classnames";

class Footer extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }
        const { styles } = this.props;

        const css = classSet(
            styles.panelFooter,
            this.props.align === 'right' ? 'text-right' : null,
            this.props.className
        );

        const { Panel } = this.props;

        return (
            <Panel.Footer className={css}>
                {this.props.children}
            </Panel.Footer>
        );
    }
}

Footer.defaultProps = {
    align: null
};

export default createComponent(Footer, { modules: ['Panel'], styles });