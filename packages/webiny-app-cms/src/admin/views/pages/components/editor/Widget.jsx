import React from "react";
import classSet from "classnames";
import { createComponent } from "webiny-app";
import styles from "./Widget.scss";

class Widget extends React.Component {
    render() {
        const {
            widget,
            services: { cms }
        } = this.props;

        let editorWidget = cms.getEditorWidget(widget.type);
        if (!editorWidget) {
            return null;
        }

        return (
            <div className={classSet(styles.editorWidget)}>
                {editorWidget.widget.renderWidget()}
            </div>
        );
    }
}

export default createComponent(Widget, { services: ["cms"] });
