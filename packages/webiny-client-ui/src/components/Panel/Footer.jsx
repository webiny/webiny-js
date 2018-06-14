import React from 'react';
import { inject } from 'webiny-client';
import classSet from "classnames";
import styles from './styles.css?prefix=wui-panel';

@inject({ styles })
class Footer extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const classes = classSet(this.props.styles.footer, this.props.className);
        return <div className={classes} style={this.props.style}>{this.props.children}</div>;
    }
}

Footer.defaultProps = {
    style: {}
};

export default Footer;