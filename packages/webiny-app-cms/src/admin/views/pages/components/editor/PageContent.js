import React from "react";
import _ from "lodash";
import { app, createComponent } from "webiny-app";
import { FormComponent } from "webiny-app-ui";
import shortid from "shortid";
import WidgetsModal from "./WidgetsModal";
import WidgetFunctions from "./WidgetFunctions";
import WidgetHolder from "./WidgetHolder";
import styles from "./PageContent.scss";

class PageContent extends React.Component {
    constructor() {
        super();
        this.state = {};
        this.cms = app.services.get("cms");
        this.addWidget = this.addWidget.bind(this);
        this.removeWidget = this.removeWidget.bind(this);
        this.beforeRemoveWidget = this.beforeRemoveWidget.bind(this);
        this.swapWidgets = this.swapWidgets.bind(this);
    }

    addWidget({ type }) {
        let { value, onChange } = this.props;
        if (!value) {
            value = [];
        }

        value.push({
            id: shortid.generate(),
            type,
            data: {},
            settings: {}
        });

        onChange(value);
    }

    showWidgetSettings() {}

    beforeRemoveWidget(data) {
        const widget = this.cms.getEditorWidget(data.type);
        if (typeof widget.removeWidget === "function") {
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

    renderWidget(data, index) {
        const { value, onChange } = this.props;

        const widget = this.cms.getEditorWidget(data.type);
        const editorWidget = widget.renderWidget(data);

        return (
            <WidgetHolder key={data.id}>
                {/*<WidgetSettingsModal name={data.id + "-settings"} widget={widget} data={data} />*/}
                <WidgetFunctions
                    moveUp={() => this.swapWidgets(index, index - 1)}
                    showSettings={this.showWidgetSettings}
                    beforeRemove={() => this.beforeRemoveWidget(data)}
                    onRemoved={() => this.removeWidget(data)}
                    moveDown={() => this.swapWidgets(index, index + 1)}
                />
                {React.cloneElement(editorWidget, {
                    value: data,
                    onChange: data => {
                        value[index].data = data;
                        onChange(value);
                    }
                })}
            </WidgetHolder>
        );
    }

    renderPreviewWidget(data) {
        const widget = this.cms.getWidget(data.type);
        const preview = widget.render(data);

        return <div key={data.id}>{React.cloneElement(preview, { value: data })}</div>;
    }

    render() {
        const { Button, Grid, Tabs } = this.props.modules;

        return (
            <page-content>
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
                <Grid.Row>
                    <Grid.Col all={6}>
                        <div className={styles.editorContent}>
                            {this.props.value && this.props.value.map(this.renderWidget.bind(this))}
                        </div>
                    </Grid.Col>
                    <Grid.Col all={6}>
                        <div className={styles.editorContent}>
                            <Tabs>
                                <Tabs.Tab label={"Preview"}>
                                    {this.props.value &&
                                        this.props.value.map(this.renderPreviewWidget.bind(this))}
                                </Tabs.Tab>
                                <Tabs.Tab label={"Model"}>
                                    <pre>
                                        {JSON.stringify(this.props.form.state.model, null, 2)}
                                    </pre>
                                </Tabs.Tab>
                            </Tabs>
                        </div>
                    </Grid.Col>
                </Grid.Row>
            </page-content>
        );
    }
}

export default createComponent([PageContent, FormComponent], {
    modules: ["Button", "Grid", "Tabs"]
});
