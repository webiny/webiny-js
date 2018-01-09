import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Header extends Webiny.Ui.Component {

}

Header.defaultProps = {
    icon: null,
    style: null,
    title: null,
    renderer() {
        const {Icon, icon, styles, className} = this.props;

        const classes = this.classSet(styles.header, className);
        return (
            <div className={classes} style={this.props.style || null}>
                {icon ? <div className={styles.ico}><Icon icon={icon}/></div> : null}
                <h3>{this.props.title}</h3>
                {this.props.children}
            </div>
        );
    }
};

export default Webiny.createComponent(Header, {styles, modules: ['Icon']});