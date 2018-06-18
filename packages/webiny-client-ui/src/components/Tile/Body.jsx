import React from 'react';
import classSet from "classnames";
import { inject } from 'webiny-client';
import styles from "./styles.module.css";

@inject({ styles })
class Body extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { styles, className, children, style } = this.props;

        return (
            <div style={style} className={classSet(styles.content, className)}>{children}</div>
        );
    }
}

export default Body;