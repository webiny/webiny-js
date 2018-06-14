import React from "react";
import _ from "lodash";
import { inject } from "webiny-client";
import styles from "./styles.css?prefix=Webiny_Ui_Section";

@inject({ modules: ["Icon"], styles })
class Section extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const {
            modules: { Icon },
            styles,
            title,
            children
        } = this.props;
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

export default Section;
