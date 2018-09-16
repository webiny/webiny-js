import React from 'react';
import classSet from "classnames";
import { inject } from 'webiny-app';
import styles from "./styles.module.css";

@inject({ styles })
class Growl extends React.Component {
    constructor(props) {
        super(props);

        this.close = this.close.bind(this);
    }

    componentDidMount() {
        if (!this.props.sticky) {
            this.closeDelay = setTimeout(() => {
                this.close();
            }, this.props.ttl || 3000);
        }
    }

    componentWillUnmount() {
        clearTimeout(this.closeDelay);
        this.closeDelay = null;
    }

    close() {
        this.props.onRemove(this);
    }

    render() {
        const { styles } = this.props;

        const typeClasses = {
            default: '',
            danger: styles.danger,
            success: styles.success,
            warning: styles.warning
        };

        const classes = classSet(
            styles.notification,
            typeClasses[this.props.type],
            this.props.className
        );
        const title = this.props.title ? <div className={styles.header}>{this.props.title}</div> : null;
        let messages = [];
        if (this.props.message) {
            messages.push(this.props.message);
        }

        if (this.props.children) {
            messages = React.Children.toArray(this.props.children);
        }

        return (
            <div className={classes} style={{ display: 'block' }} ref={this.props.onRef}>
                <div className={styles.close} onClick={this.close}>×</div>
                {title}
                {messages.map((msg, i) => {
                    return <div key={i} className={styles.message}>{msg}</div>;
                })}
            </div>
        );
    }
}

Growl.defaultProps = {
    title: null,
    ttl: 3000,
    sticky: false,
    message: null,
    className: null,
    type: 'default',
    onRef: null
};

export default Growl;