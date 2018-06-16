import React from "react";
import classSet from "classnames";
import { inject } from "webiny-client";
import styles from "./styles.module.scss";

const Item = props => {
    const { title, icon, children, isActive, onClick, styles, Icon } = props;

    return (
        <div className={classSet(styles.item, isActive && styles.active)}>
            <div className={styles.title} onClick={onClick}>
                {icon && <Icon icon={icon} />}
                {title}
            </div>
            <div className={styles.body}>{children}</div>
        </div>
    );
};

@inject({ styles, modules: ["Icon"] })
class Accordion extends React.Component {
    state = {
        active: 0
    };

    static Item = Item;

    onClick = index => {
        this.setState(state => {
            return {
                active: state.active === index ? null : index
            };
        });
    };

    render() {
        const {
            styles,
            modules: { Icon }
        } = this.props;
        return (
            <div className={styles.container}>
                {React.Children.map(this.props.children, (child, i) =>
                    React.cloneElement(child, {
                        key: i,
                        styles,
                        Icon,
                        isActive: this.state.active === i,
                        onClick: () => this.onClick(i)
                    })
                )}
            </div>
        );
    }
}

export default Accordion;
