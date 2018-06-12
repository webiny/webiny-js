import React from "react";
import classSet from "classnames";
import { Component } from "webiny-app";
import styles from "./AddWidget.scss?prefix=wby-cms-editor-addWidget";

@Component({ modules: ["Icon"], services: ["cms"] })
export default class AddWidget extends React.Component {
    state = {
        search: ""
    };

    renderWidget = ({ type, widget}) => {
        const {
            modules: { Icon }
        } = this.props;

        return (
            <div key={type} className={styles.widget} onClick={() => this.props.onAdd({ type, widget })}>
                <img src={widget.options.image} width={"100%"} />
                <div className={styles.description}>
                    <h3>{widget.options.title}</h3>
                    <p>{widget.options.description}</p>
                </div>
                <div className={styles.overlay} />
                <div className={styles.insert}>
                    <span>Insert widget</span>
                    <div className={styles.icon}>
                        <Icon icon={"plus-circle"} size={"5x"} />
                    </div>
                </div>
            </div>
        );
    };

    render() {
        const {
            modules: { Icon },
            show,
            services: { cms }
        } = this.props;
        return (
            <div className={classSet(styles.container, show && styles.show)}>
                {cms.getWidgetGroups().map(group => (
                    <div className={styles.group} key={group.name}>
                        <h2>{group.title}</h2>
                        {cms
                            .getEditorWidgets(group.name)
                            .map(widget => this.renderWidget(cms.getEditorWidget(widget.type)))}
                    </div>
                ))}
            </div>
        );
    }
}
