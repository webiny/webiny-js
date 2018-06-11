import React, { Fragment } from "react";
import _ from "lodash";
import { Component } from "webiny-app";
import shortid from "shortid";
import Widget from "./Widget";
import Sidebar from "./Sidebar";
import WidgetSettingsSidebar from "./WidgetSettingsSidebar";
import AddWidget from "./AddWidget";
import styles from "./PageContent.scss?prefix=wby-cms-editor";

@Component({
    modules: ["Grid", "Animate", "Icon"],
    services: ["cms"]
})
export default class PageContent extends React.Component {
    state = {
        toggleSidebar: false,
        activeWidget: null,
        dragging: false,
        toggleWidget: false
    };

    cms = this.props.services.cms;

    checkKey = event => {
        if (event.keyCode === 27) {
            this.setState({ toggleSidebar: false });
        }
    };

    componentDidMount() {
        document.addEventListener("keydown", this.checkKey, false);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.checkKey, false);
    }

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
        this.setState({ activeWidget: widget.id, toggleSidebar: true });
    };

    selectWidget = () => {};

    render() {
        const {
            value,
            modules: { Grid, Animate, Icon }
        } = this.props;

        const widget = _.find(this.props.value, {
            id: this.state.activeWidget
        });

        return (
            <Grid.Row>
                <div className={styles.editorContainer}>
                    <div className={styles.editorContent}>
                        {value.map((widget, index) => (
                            <Fragment key={widget.id}>
                                <Widget
                                    selectWidget={this.selectWidget}
                                    addWidget={widget => this.addWidget(widget, 0)}
                                    moveUp={() => this.reorder(index, index - 1)}
                                    moveDown={() => this.reorder(index, index + 1)}
                                    onChange={data => {
                                        this.onWidgetChange(widget.id, data);
                                    }}
                                    editWidget={this.showSettings}
                                    deleteWidget={this.removeWidget}
                                    widget={widget}
                                />
                            </Fragment>
                        ))}
                        <Animate
                            trigger={this.state.toggleSidebar}
                            enterAnimation={{ type: "easeInOut", translateX: -400, duration: 250}}
                            exitAnimation={{ type: "easeInOut", translateX: 400, duration: 250}}
                            onExited={() => this.setState({ activeWidget: null })}
                        >
                            {({ ref }) => (
                                <Sidebar offset={53}>
                                    {({ height }) => (
                                        <WidgetSettingsSidebar
                                            animationTarget={ref}
                                            className={styles.editorSidebar}
                                            height={height}
                                            widget={widget}
                                            onChange={data => {
                                                this.onWidgetChange(this.state.activeWidget, data);
                                            }}
                                            onClose={() => this.setState({ toggleSidebar: false })}
                                        />
                                    )}
                                </Sidebar>
                            )}
                        </Animate>
                    </div>
                </div>
            </Grid.Row>
        );
    }
}
