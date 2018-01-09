import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Fieldset extends Webiny.Ui.Component {

}

Fieldset.defaultProps = {
    title: null,
    className: null,
    style: null,
    renderer() {
        const {styles, ...props} = this.props;
        return (
            <fieldset className={this.classSet(styles.fieldset, props.className)}>
                {props.title && (
                    <legend className={styles.legend}>{props.title}</legend>
                )}
                {props.children}
            </fieldset>
        );
    }
};

export default Webiny.createComponent(Fieldset, {styles});