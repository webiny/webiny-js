import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Label extends Webiny.Ui.Component {

}

Label.defaultProps = {
    inline: false,
    type: 'default',
    // NOTE: 'style' and 'styles' is not the same! 'styles' is a css-modules object with classes while 'style' is a css styles object
    style: null,
    className: null,
    renderer() {
        const {styles, ...props} = this.props;

        const typeClasses = {
            default: styles.default,
            info: styles.info,
            primary: styles.primary,
            success: styles.success,
            warning: styles.warning,
            error: styles.danger
        };

        const classes = this.classSet(
            styles.label,
            typeClasses[props.type],
            props.className
        );

        const style = _.clone(this.props.style || {});
        if (this.props.inline) {
            style['float'] = 'none';
        }

        return (
            <span className={classes} style={style}>
                {props.children}
            </span>
        );
    }
};

export default Webiny.createComponent(Label, {styles});
