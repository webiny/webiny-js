import React from "react";
import classSet from "classnames";
import { createComponent } from "webiny-app";
import styles from "./styles.css?prefix=Webiny_Ui_Loader";

class Loader extends React.Component {
    constructor() {
        super();
        this.timeout = null;
        this.state = {
            show: false
        };
    }

    componentDidMount() {
        if (this.props.wait) {
            this.timeout = setTimeout(() => {
                this.setState({ show: true });
            }, this.props.wait);
            return;
        }
        this.setState({ show: true });
    }

    componentWillUnmount() {
        this.props.wait && clearTimeout(this.timeout);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        if (this.state.show) {
            const { styles } = this.props;
            return (
                <div
                    className={classSet(styles.overlay, this.props.className)}
                    style={this.props.style}
                >
                    <div className={styles.iconWrapper}>
                        <div className={styles.icon} />
                        {this.props.children ? (
                            <loader-content>{this.props.children}</loader-content>
                        ) : null}
                    </div>
                </div>
            );
        }

        return this.props.children || null;
    }
}

Loader.defaultProps = {
    wait: 50,
    className: null,
    style: null
};

export default createComponent(Loader, { styles });
