import React, { Fragment } from "react";
import { Component } from "webiny-client";
import Widget from "./Widget";
import styles from "./AddWidget.scss?prefix=wby-cms-editor-addWidget";

@Component({ modules: ["Icon"], services: ["cms"] })
class AddWidget extends React.Component {
    state = {
        selectWidget: true
    };

    selectWidget = () => {
        this.setState({ selectWidget: true });
    };

    render() {
        const {
            modules: { Icon },
            services: { cms }
        } = this.props;
        return (
            <div className={styles.container}>
                {this.state.selectWidget ? (
                    <Fragment>
                        <div className={styles.widgetSelector}>
                            <ul className={styles.widgetGroups}>
                                {cms.getWidgetGroups().map(group => (
                                    <li key={group.name}>
                                        <Icon icon={group.icon}/> {group.title}
                                        <div>
                                            {cms.getEditorWidgets(group.name).map(widget => (
                                                <Widget key={widget.type} widget={widget}/>
                                            ))}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Fragment>
                ) : (
                    <Fragment>
                        <span className={styles.line} />
                        <span className={styles.addContent} onClick={this.selectWidget}>
                            <Icon icon={"plus-circle"} /> Add new content
                        </span>
                    </Fragment>
                )}
            </div>
        );
    }
}

export default AddWidget;
