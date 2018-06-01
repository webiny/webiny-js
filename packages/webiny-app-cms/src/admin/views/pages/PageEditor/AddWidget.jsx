import React, { Fragment } from "react";
import { createComponent } from "webiny-app";
import styles from "./AddWidget.scss?prefix=wby-cms-editor-addWidget";

class AddWidget extends React.Component {
    state = {
        selectWidget: false
    };

    selectWidget = () => {
        this.setState({ selectWidget: true });
    };

    render() {
        const {
            modules: { Icon, Tabs },
            services: { cms },
            onAdd
        } = this.props;
        return (
            <div className={styles.container}>
                {this.state.selectWidget ? (
                    <Fragment>
                        <div className={styles.widgetSelector}>
                            <Icon
                                style={{
                                    position: "absolute",
                                    right: 20,
                                    top: -40,
                                    cursor: "pointer",
                                    color: "#bbbbbb"
                                }}
                                icon={"times"}
                                size={"2x"}
                                onClick={() => this.setState({ selectWidget: false })}
                            />
                            <Tabs position={"left"}>
                                {cms.getWidgetGroups().map(group => (
                                    <Tabs.Tab
                                        key={group.name}
                                        icon={group.icon}
                                        label={group.title}
                                    >
                                        {cms.getEditorWidgets(group.name).map(widget => (
                                            <div
                                                key={widget.type}
                                                style={{ cursor: "pointer" }}
                                                onClick={() => {
                                                    this.setState({ selectWidget: false }, () =>
                                                        onAdd(widget)
                                                    );
                                                }}
                                            >
                                                {cms
                                                    .getEditorWidget(widget.type)
                                                    .widget.renderSelector()}
                                            </div>
                                        ))}
                                    </Tabs.Tab>
                                ))}
                            </Tabs>
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

export default createComponent(AddWidget, { modules: ["Icon", "Tabs"], services: ["cms"] });
