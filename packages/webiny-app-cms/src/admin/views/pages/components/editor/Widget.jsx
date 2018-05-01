import React from "react";
import classSet from "classnames";
import { createComponent } from "webiny-app";
import styles from "./Widget.scss";
import EditorWidget from "./EditorWidget";
import WidgetFunctions from "./WidgetFunctions";
import WidgetSettingsDialog from "./WidgetSettingsDialog";

class Widget extends React.Component {
    constructor() {
        super();

        this.applyGlobalWidgetChanges = this.applyGlobalWidgetChanges.bind(this);
    }

    applyGlobalWidgetChanges() {
        const { data, settings, origin } = this.props.widget;
        this.props.services.cms.updateGlobalWidget(origin, { data, settings }).then(() => {
            this.props.onChange({ data: null, settings: null, __dirty: false });
        });
    }

    render() {
        const {
            widget,
            functions,
            onChange,
            modules: { Link, Icon },
            services: { cms }
        } = this.props;

        const isGlobal = !!widget.origin;
        const isDirty = !!widget.__dirty;

        let editorWidget = cms.getEditorWidget(widget.type);
        if (!editorWidget) {
            return null;
        }

        functions.showSettings = () => this.settingsDialog.show();

        return (
            <div className={classSet(styles.editorWidget, isGlobal && styles.globalWidget)}>
                <React.Fragment>
                    <WidgetSettingsDialog
                        name={widget.id + "-settings"}
                        widget={widget}
                        isGlobal={isGlobal}
                        onChange={model => onChange({ settings: model, __dirty: true })}
                        onReady={ref => (this.settingsDialog = ref)}
                    />
                    <WidgetFunctions widget={widget} {...functions} />
                    {React.cloneElement(
                        editorWidget.widget.renderWidget({ EditorWidget, widget }),
                        {
                            widget,
                            onChange: model => onChange({ data: model, __dirty: true }),
                            isGlobal
                        }
                    )}
                    {isGlobal &&
                        isDirty && (
                            <div style={{ marginTop: 5 }}>
                                Note: changes on global widgets must be saved explicitly.
                                <br />
                                <Link onClick={this.applyGlobalWidgetChanges}>
                                    <Icon icon={"save"} /> Save changes
                                </Link>
                            </div>
                        )}
                </React.Fragment>
            </div>
        );
    }
}

export default createComponent(Widget, { modules: ["Link", "Icon"], services: ["cms"] });
