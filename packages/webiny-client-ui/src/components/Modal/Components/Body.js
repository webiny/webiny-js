import React from "react";
import classSet from "classnames";
import { inject } from "webiny-client";
import styles from "../styles.module.scss";

@inject({ styles })
class Body extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { styles, style } = this.props;
        return (
            <div
                style={style}
                className={classSet(
                    styles.body,
                    this.props.noPadding && styles.noPadding,
                    this.props.className
                )}
            >
                {this.props.children}
            </div>
        );
    }
}

Body.defaultProps = {
    noPadding: false,
    style: null
};

export default Body;
