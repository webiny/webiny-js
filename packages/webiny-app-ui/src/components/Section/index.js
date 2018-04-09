import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-app";
import styles from "./styles.css";

class Section extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { modules: { Icon }, styles, title, children } = this.props;
        let icon = null;
        if (this.props.icon) {
            icon = <Icon icon={this.props.icon} />;
        }

        return (
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <h5 className={styles.title}>
                        {icon} {title}
                    </h5>
                    {_.size(children) > 0 && <div className={styles.container}>{children}</div>}
                </div>
            </div>
        );
    }
}

Section.defaultProps = {
    title: null,
    icon: null
};

export default createComponent(Section, { modules: ["Icon"], styles });
