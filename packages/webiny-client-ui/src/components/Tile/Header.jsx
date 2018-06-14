import React from 'react';
import classSet from "classnames";
import { inject } from 'webiny-client';
import styles from './styles.css?prefix=Webiny_Ui_Tile_Header';

@inject({ styles, modules: ['Icon'] })
class Header extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { modules: { Icon }, icon, styles, className, style, children, title } = this.props;

        const classes = classSet(styles.header, className);
        return (
            <div className={classes} style={style || null}>
                {icon ? <div className={styles.ico}><Icon icon={icon}/></div> : null}
                <h3>{title}</h3>
                {children}
            </div>
        );
    }
}

Header.defaultProps = {
    icon: null,
    style: null,
    title: null
};

export default Header;