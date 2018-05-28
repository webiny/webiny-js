import React from "react";
import classSet from "classnames";
import { createComponent } from "webiny-app";
import styles from "./styles.scss?prefix=wui-accordion";

const Item = createComponent(props => {
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
});

class Accordion extends React.Component {
    state = {
        active: 0
    };

    static Item = Item;

    onClick = index => {
        this.setState({ active: index });
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

export default createComponent(Accordion, { styles, modules: ["Icon"] });
