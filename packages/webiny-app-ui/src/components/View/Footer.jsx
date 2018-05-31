import React from 'react';
import { createComponent } from 'webiny-app';
import styles from './styles.css?prefix=wui-view'
import classSet from "classnames";

class Footer extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }
        const { modules: { Panel }, styles } = this.props;

        const css = classSet(
            styles.panelFooter,
            this.props.align === 'right' ? 'text-right' : null,
            this.props.className
        );

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