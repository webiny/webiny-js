import React from 'react';
import { inject } from 'webiny-client';
import styles from "./styles.module.css"
import classSet from "classnames";

@inject({ modules: ['Panel'], styles })
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

export default Footer;