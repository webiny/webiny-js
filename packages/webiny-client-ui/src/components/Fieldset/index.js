import React from "react";
import { inject } from "webiny-client";
import classSet from "classnames";
import styles from "./styles.css?prefix=Webiny_Ui_Fieldset";

@inject({ styles })
class Fieldset extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { styles, ...props } = this.props;
        return (
            <fieldset className={classSet(styles.fieldset, props.className)}>
                {props.title && <legend className={styles.legend}>{props.title}</legend>}
                {props.children}
            </fieldset>
        );
    }
}

Fieldset.defaultProps = {
    title: null,
    className: null,
    style: null
};

export default Fieldset;
