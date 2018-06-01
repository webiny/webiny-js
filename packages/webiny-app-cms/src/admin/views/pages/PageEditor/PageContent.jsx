import React, { Fragment } from "react";
import _ from "lodash";
import { Component } from "webiny-app";
import shortid from "shortid";
import Widget from "./Widget";
import WidgetSettings from "./WidgetSettings";
import AddWidget from "./AddWidget";
import styles from "./PageContent.scss?prefix=wby-cms-editor";

@Component({
    modules: ["Grid", "Animate", "Icon"],
    services: ["cms"]
})
export default class PageContent extends React.Component {
    state = {
        activeWidget: null,
        dragging: false,
        toggleWidget: false
    };

    cms = this.props.services.cms;

    addWidget = (widget, index) => {
        let { value, onChange } = this.props;
        if (!value) {
            value = [];
        }

        value.splice(index, 0, _.merge({ data: {} }, widget, { id: shortid.generate() }));

        onChange(value);
    };

    beforeRemoveWidget = ({ widget }) => {
        const editorWidget = this.cms.getEditorWidget(widget.type);
        if (typeof editorWidget.removeWidget === "function") {
            return editorWidget.removeWidget(widget);
        }
        return Promise.resolve();
    };

    removeWidget = ({ id }) => {
        if (id === this.state.activeWidget) {
            this.setState({ activeWidget: null });
        }
        const widgets = _.cloneDeep(this.props.value);
        widgets.splice(_.findIndex(widgets, { id }), 1);
        this.props.onChange(widgets);
    };

    onWidgetChange = (widgetId, data) => {
        const { value } = this.props;
        const index = _.findIndex(value, { id: widgetId });
        const widget = value[index];

        value[index] = { ..._.cloneDeep(widget), data };

        this.props.onChange(value);
    };

    // a little function to help us with reordering the result
    reorder = (startIndex, endIndex) => {
        if (endIndex < 0 || endIndex > this.props.value.length - 1) {
            return;
        }

        const result = Array.from(this.props.value);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        this.props.onChange(result);
    };

    showSettings = widget => {
        this.setState({ activeWidget: widget.id });
    };

    render() {
        const {
            value,
            modules: { Grid, Animate, Icon }
        } = this.props;

        return (
            <Grid.Row>
                <div className={styles.editorContainer}>
                    <div className={styles.editorContent}>
                        <AddWidget onAdd={widget => this.addWidget(widget, 0)} />
                        {value.map((widget, index) => (
                            <Fragment key={widget.id}>
                                <div
                                    style={{
                                        padding: "0 20px",
                                        backgroundColor: "white"
                                    }}
                                >
                                    <Widget
                                        moveUp={() => this.reorder(index, index - 1)}
                                        moveDown={() => this.reorder(index, index + 1)}
                                        onChange={data => {
                                            this.onWidgetChange(widget.id, data);
                                        }}
                                        editWidget={this.showSettings}
                                        deleteWidget={this.removeWidget}
                                        widget={widget}
                                    />
                                </div>
                                <AddWidget onAdd={widget => this.addWidget(widget, index + 1)} />
                            </Fragment>
                        ))}
                        <Animate
                            trigger={!!this.state.activeWidget}
                            hide={{ translateX: 400, opacity: 0, duration: 225 }}
                            show={{ translateX: 0, opacity: 1, duration: 225 }}
                        >
                            <div className={styles.editorSidebar}>
                                <span
                                    onClick={() => this.setState({ activeWidget: null })}
                                    style={{
                                        position: "absolute",
                                        right: 15,
                                        top: 18
                                    }}
                                >
                                    <Icon icon={"times"} size={"lg"} />
                                </span>
                                {this.state.activeWidget && (
                                    <WidgetSettings
                                        key={this.state.activeWidget}
                                        onClose={() => this.setState({ activeWidget: null })}
                                        onChange={data =>
                                            this.onWidgetChange(this.state.activeWidget, data)
                                        }
                                        widget={_.find(this.props.value, {
                                            id: this.state.activeWidget
                                        })}
                                    />
                                )}
                            </div>
                        </Animate>
                    </div>
                </div>
            </Grid.Row>
        );
    }
}
