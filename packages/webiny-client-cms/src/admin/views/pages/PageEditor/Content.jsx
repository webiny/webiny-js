import React, { Fragment } from "react";
import _ from "lodash";
import { inject } from "webiny-client";
import shortid from "shortid";
import Widget from "./Widget";
import Sidebar from "./Sidebar";
import WidgetSettingsSidebar from "./WidgetSettingsSidebar";
import AddWidget from "./AddWidget";
import styles from "./Content.module.scss";

@inject({
    modules: ["Animate", "Icon", "Button"],
    services: ["cms"]
})
class Content extends React.Component {
    state = {
        selectWidget: null,
        toggleSidebar: false,
        activeWidget: null,
        dragging: false,
        toggleWidget: false
    };

    cms = this.props.services.cms;

    checkKey = event => {
        if (event.keyCode === 27) {
            if (this.state.selectWidget !== null) {
                this.setState({ selectWidget: null });
            } else {
                this.setState({ toggleSidebar: false });
            }
        }
    };

    componentDidMount() {
        document.addEventListener("keydown", this.checkKey, false);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.checkKey, false);
    }

    addWidget = ({type, widget}) => {
        let { value, onChange } = this.props;
        if (!value) {
            value = [];
        }

        value.splice(this.state.selectWidget, 0, {
            data: { ...(widget.options.data || {}) },
            type,
            id: shortid.generate()
        });

        this.setState({ selectWidget: null }, () => {
            onChange(value);
        });
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

    selectWidget = index => {
        this.setState({
            selectWidget: index
        });
    };

    render() {
        const {
            value,
            modules: { Animate, Icon, Button }
        } = this.props;

        const widget = _.find(this.props.value, {
            id: this.state.activeWidget
        });

        return (
            <React.Fragment>
                <AddWidget show={this.state.selectWidget !== null} onAdd={this.addWidget} />
                <div className={styles.editorContent}>
                    {!value.length && (
                        <div style={{ textAlign: "center", paddingTop: "50%" }}>
                            <p style={{ fontSize: 16, fontWeight: "bold" }}>
                                Well, it's time to add some content!<br />Begin by clicking the
                                button below :)
                            </p>
                            <Button type={"primary"} onClick={() => this.selectWidget(0)}>
                                <Icon icon={"plus-circle"} /> Add widget
                            </Button>
                        </div>
                    )}
                    {value.map((widget, index) => (
                        <Fragment key={widget.id}>
                            <Widget
                                selectWidget={() => this.selectWidget(index + 1)}
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
                        enterAnimation={{ type: "easeInOut", translateX: -400, duration: 250 }}
                        exitAnimation={{ type: "easeInOut", translateX: 400, duration: 250 }}
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
            </React.Fragment>
        );
    }
}

export default Content;
