import React from 'react';
import classSet from "classnames";
import { inject } from 'webiny-app';
import styles from "./styles.module.css";

@inject({ styles })
class Header extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        let icon = null;
        if (this.props.icon) {
            icon = <span className="panel-icon"><i className={this.props.icon}/></span>;
        }

        const classes = classSet(this.props.styles.header, this.props.className);
        return (
            <div className={classes} style={this.props.style || null}>
                {icon} {this.props.title}
                {this.props.children}
            </div>
        );
    }
}

Header.defaultProps = {
    title: null,
    icon: null
};

export default Header;