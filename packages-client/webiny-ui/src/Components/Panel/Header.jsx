import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Header extends Webiny.Ui.Component {

}

Header.defaultProps = {
    title: null,
    icon: null,
    renderer() {
        let icon = null;
        if (this.props.icon) {
            icon = <span className="panel-icon"><i className={this.props.icon}/></span>;
        }

        const classes = this.classSet(this.props.styles.header, this.props.className);
        return (
            <div className={classes} style={this.props.style || null}>
                {icon} {this.props.title}
                {this.props.children}
            </div>
        );
    }
};

export default Webiny.createComponent(Header, {styles});