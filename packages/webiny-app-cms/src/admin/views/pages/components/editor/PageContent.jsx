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

    showWidgetSettings() {}

    beforeRemoveWidget(data) {
        const widget = this.cms.getEditorWidget(data.type);
        if (typeof widget.removeWidget === "function" && !data.origin) {
            return widget.removeWidget(data);
        }
        return Promise.resolve();
    }

    removeWidget(data) {
        const widgets = _.cloneDeep(this.props.value);
        widgets.splice(_.findIndex(widgets, { id: data.id }), 1);
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

    renderWidget(data, index) {
        const functions = {
            moveUp: () => this.swapWidgets(index, index - 1),
            toggleScope: () => this.viewSwitcher.showView("toggleScope")(data),
            showSettings: this.showWidgetSettings,
            beforeRemove: () => this.beforeRemoveWidget(data),
            onRemoved: () => this.removeWidget(data),
            moveDown: () => this.swapWidgets(index, index + 1)
        };

        const widget = { ...data };

        if (data.origin) {
            const wd = this.cms.getEditorWidget(widget.type, { origin: data.origin });
            _.assign(widget, _.pick(wd, ["data", "settings"]));
        }

        const valueProps = {
            onChange: data => {
                const { value } = this.props;
                value[index].data = data;

                this.props.onChange(value);
            }
        };

        return <Widget key={widget.id} widget={widget} functions={functions} {...valueProps} />;
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
                                                {this.props.value &&
                                                    this.props.value.map(
                                                        this.renderWidget.bind(this)
                                                    )}
                                            </div>
                                        </Grid.Col>
                                        <Grid.Col all={6}>
                                            <div
                                                className={styles.editorContent}
                                                style={{ padding: 0, border: 0 }}
                                            >
                                                <Tabs>
                                                    <Tabs.Tab label={"Preview"}>
                                                        {this.props.value && (
                                                            <PageContentPreview
                                                                content={this.props.value}
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
                                widget={data}
                                onSuccess={widget => this.makeWidgetGlobal(data, widget)}
                            />
                        );
                    }}
                </ViewSwitcher.View>
            </ViewSwitcher>
        );
    }
}

export default createComponent(PageContent, {
    modules: ["Button", "Grid", "Tabs", "ViewSwitcher", "Modal"],
    services: ["cms"]
});
