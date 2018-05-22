import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-app";
import shortid from "shortid";
import WidgetsModal from "./WidgetsModal";
import Widget from "./Widget";
import styles from "./PageContent.scss";
import MakeGlobalDialog from "./MakeGlobalDialog";
import PageContentPreview from "./../PageContentPreview";

class PageContent extends React.Component {
    constructor(props) {
        super();
        this.state = {};
        this.cms = props.services.cms;
        this.addWidget = this.addWidget.bind(this);
        this.removeWidget = this.removeWidget.bind(this);
        this.beforeRemoveWidget = this.beforeRemoveWidget.bind(this);
        this.swapWidgets = this.swapWidgets.bind(this);
        this.toggleScope = this.toggleScope.bind(this);
        this.makeWidgetLocal = this.makeWidgetLocal.bind(this);
        this.makeWidgetGlobal = this.makeWidgetGlobal.bind(this);
    }

    addWidget(widget) {
        let { value, onChange } = this.props;
        if (!value) {
            value = [];
        }

        value.push(_.merge({ data: {} }, widget, { id: shortid.generate() }));

        onChange(value);
    }

    beforeRemoveWidget({ widget }) {
        const editorWidget = this.cms.getEditorWidget(widget.type);
        if (typeof editorWidget.removeWidget === "function" && !widget.origin) {
            return editorWidget.removeWidget(widget);
        }
        return Promise.resolve();
    }

    removeWidget({ id }) {
        const widgets = _.cloneDeep(this.props.value);
        widgets.splice(_.findIndex(widgets, { id }), 1);
        this.props.onChange(widgets);
    }

    swapWidgets(a, b) {
        const count = this.props.value.length;
        if (count === 1 || b === count || b === -1) {
            return;
        }

        const widgets = _.cloneDeep(this.props.value);
        widgets.splice(b, 1, widgets.splice(a, 1, widgets[b])[0]);
        this.props.onChange(widgets);
    }

    toggleScope(data) {
        this.setState({ toggleScope: data }, () => {
            data.origin ? this.makeLocalDialog.show() : this.makeGlobalDialog.show();
        });
    }

    makeWidgetLocal(global) {
        // Make widget global
        const localWidget = _.pick(global, ["id", "type", "data", "settings"]);
        const widgets = _.cloneDeep(this.props.value);
        widgets.splice(_.findIndex(widgets, { id: global.id }), 1, localWidget);
        this.props.onChange(widgets);
    }

    makeWidgetGlobal(local, origin) {
        const widgets = _.cloneDeep(this.props.value);
        widgets.splice(_.findIndex(widgets, { id: local.id }), 1, _.merge({}, local, { origin }));

        // Propagate changes
        this.props.onChange(widgets);
    }

    deleteGlobalWidget(id) {
        return this.cms.deleteGlobalWidget(id);
    }

    onWidgetChange(widget, update) {
        const { value } = this.props;
        const { data, settings, __dirty } = update;

        const newWidget = {
            ...widget,
            __dirty
        };

        if (data !== undefined) {
            newWidget["data"] = data;
        }

        if (settings !== undefined) {
            newWidget["settings"] = settings;
        }

        value[_.findIndex(value, { id: widget.id })] = newWidget;

        this.props.onChange(value);
    }

    renderWidget(data, index) {
        const { modules: { Alert } } = this.props;
        const widget = _.cloneDeep(data);

        const functions = {
            moveUp: () => this.swapWidgets(index, index - 1),
            toggleScope: () => this.viewSwitcher.showView("toggleScope")(widget),
            beforeRemove: () => this.beforeRemoveWidget({ widget }),
            onRemoved: () => this.removeWidget({ widget }),
            moveDown: () => this.swapWidgets(index, index + 1)
        };

        if (widget.origin) {
            const wd = this.cms.getEditorWidget(widget.type, { origin: widget.origin });
            if (!wd) {
                return (
                    <Alert key={widget.id} type={"danger"}>
                        Missing widget for type <strong>{widget.type}</strong>
                    </Alert>
                );
            }
            if (!widget.data) {
                widget.data = _.cloneDeep(wd.data);
            }

            if (!widget.settings) {
                widget.settings = _.cloneDeep(wd.settings);
            }
        }

        return (
            <Widget
                key={widget.id}
                widget={widget}
                functions={functions}
                onChange={data => this.onWidgetChange(widget, data)}
            />
        );
    }

    render() {
        const { modules: { Button, Grid, Tabs, ViewSwitcher, Modal }, value } = this.props;

        const addContent = (
            <Grid.Row>
                <Grid.Col all={12} style={{ textAlign: "center" }}>
                    <Button
                        type={"primary"}
                        icon={["fas", "plus-circle"]}
                        onClick={() => this.pluginsModal.show()}
                    >
                        Add content
                    </Button>
                    <WidgetsModal
                        name={"pluginsModal"}
                        wide={true}
                        onSelect={this.addWidget}
                        onDelete={widget =>
                            this.viewSwitcher.showView("deleteGlobalWidget")(widget)
                        }
                        onReady={dialog => (this.pluginsModal = dialog)}
                    />
                </Grid.Col>
            </Grid.Row>
        );

        return (
            <ViewSwitcher onReady={actions => (this.viewSwitcher = actions)}>
                <ViewSwitcher.View name={"content"} defaultView>
                    {() => (
                        <React.Fragment>
                            {!value.length && (
                                <React.Fragment>
                                    <p style={{ textAlign: "center", marginTop: 30 }}>
                                        To begin editing your page click the big button :){" "}
                                    </p>
                                    {addContent}
                                </React.Fragment>
                            )}

                            {value.length > 0 && (
                                <React.Fragment>
                                    {addContent}
                                    <Grid.Row>
                                        <Grid.Col all={6}>
                                            <div className={styles.editorContent}>
                                                {value && value.map(this.renderWidget.bind(this))}
                                            </div>
                                        </Grid.Col>
                                        <Grid.Col all={6}>
                                            <div
                                                className={styles.editorContent}
                                                style={{ padding: 0, border: 0 }}
                                            >
                                                <Tabs>
                                                    <Tabs.Tab label={"Preview"}>
                                                        {value && (
                                                            <PageContentPreview
                                                                content={_.cloneDeep(value)}
                                                            />
                                                        )}
                                                    </Tabs.Tab>
                                                    <Tabs.Tab label={"Model"}>
                                                        <pre>
                                                            {JSON.stringify(
                                                                this.props.form.state.model,
                                                                null,
                                                                2
                                                            )}
                                                        </pre>
                                                    </Tabs.Tab>
                                                </Tabs>
                                            </div>
                                        </Grid.Col>
                                    </Grid.Row>
                                </React.Fragment>
                            )}
                        </React.Fragment>
                    )}
                </ViewSwitcher.View>
                <ViewSwitcher.View name={"toggleScope"} modal>
                    {({ data }) => {
                        if (data.origin) {
                            return (
                                <Modal.Confirmation
                                    name={"makeLocal"}
                                    confirm={"Ok, make it local!"}
                                    cancel={"Not now"}
                                    message={
                                        <span>
                                            You are about to make this widget local.<br />
                                            <br />Note that after this action this widget will no
                                            longer be affected by the changes you make to the global
                                            widget it originates from!
                                        </span>
                                    }
                                    onConfirm={() => this.makeWidgetLocal(data)}
                                />
                            );
                        }

                        return (
                            <MakeGlobalDialog
                                name={"makeGlobal"}
                                widget={data}
                                onSuccess={widget => this.makeWidgetGlobal(data, widget)}
                            />
                        );
                    }}
                </ViewSwitcher.View>
                <ViewSwitcher.View name={"deleteGlobalWidget"} modal>
                    {({ data }) => {
                        return (
                            <Modal.Confirmation
                                name={"deleteGlobalWidget"}
                                confirm={"I know what I'm doing!"}
                                cancel={"I changed my mind"}
                                message={
                                    <span>
                                        You are about to delete a global widget!<br />
                                        <br />Note that this will affect all the pages that are
                                        currently using this widget!
                                    </span>
                                }
                                onConfirm={() => this.deleteGlobalWidget(data.origin)}
                            />
                        );
                    }}
                </ViewSwitcher.View>
            </ViewSwitcher>
        );
    }
}

export default createComponent(PageContent, {
    modules: ["Alert", "Button", "Grid", "Tabs", "ViewSwitcher", "Modal"],
    services: ["cms"]
});
