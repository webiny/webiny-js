import React from "react";
import classSet from "classnames";
import { createComponent } from "webiny-app";
import styles from "./Widget.scss";
import EditorWidget from "./EditorWidget";
import WidgetFunctions from "./WidgetFunctions";

class Widget extends React.Component {
    render() {
        const { widget, functions, onChange, services: { cms } } = this.props;
        const isGlobal = !!widget.origin;

        let editorWidget = cms.getEditorWidget(widget.type);
        if (!editorWidget) {
            return null;
        }

        return (
            <div
                className={classSet(
                    styles.editorWidget,
                    isGlobal && styles.globalWidget
                )}
            >
                <React.Fragment>
                    {/*<WidgetSettingsModal name={data.id + "-settings"} widget={widget} data={data} />*/}
                    <WidgetFunctions widget={widget} {...functions} />
                    {React.cloneElement(editorWidget.renderWidget({ EditorWidget, widget }), {
                        value: widget,
                        onChange,
                        isGlobal
                    })}
                </React.Fragment>
            </div>
        );
    }
}

export default createComponent(Widget, { services: ["cms"]});
