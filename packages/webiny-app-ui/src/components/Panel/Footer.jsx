import React from 'react';
import { createComponent } from 'webiny-app';
import classSet from "classnames";
import styles from './styles.css?prefix=Webiny_Ui_Panel';

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

export default createComponent(Footer, { styles });