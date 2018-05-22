import React from "react";
import classSet from "classnames";
import { createComponent } from "webiny-app";
import styles from "./Widget.scss";

class PreviewWidget extends React.Component {
    render() {
        const {
            onClick,
            widget,
            onChange,
            services: { cms }
        } = this.props;

        let editorWidget = cms.getWidget(widget.type);
        if (!editorWidget) {
            return null;
        }

        return (
            <div className={classSet(styles.editorWidget)} onClick={() => onClick(widget)}>
                {editorWidget.widget.render({ widget, onChange })}
            </div>
        );
    }
}

export default createComponent(PreviewWidget, { services: ["cms"] });
