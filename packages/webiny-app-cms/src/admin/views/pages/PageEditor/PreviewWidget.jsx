import React from "react";
import classSet from "classnames";
import { createComponent } from "webiny-app";
import styles from "./PreviewWidget.scss?prefix=wby-cms-preview-widget";

class PreviewWidget extends React.Component {
    render() {
        const {
            moveUp,
            moveDown,
            editWidget,
            deleteWidget,
            widget,
            onChange,
            modules: { Icon },
            services: { cms }
        } = this.props;

        let editorWidget = cms.getEditorWidget(widget.type);
        if (!editorWidget) {
            return null;
        }
        
        return (
            <div className={classSet(styles.editorWidget)}>
                <div className={styles.actions}>
                    <span onClick={() => moveUp(widget)} className={styles.action}>
                        <Icon icon={"caret-up"} /> Move up{" "}
                    </span>
                    <span onClick={() => moveDown(widget)} className={styles.action}>
                        <Icon icon={"caret-down"} /> Move down{" "}
                    </span>
                    <span onClick={() => editWidget(widget)} className={styles.action}>
                        <Icon icon={"cog"} /> Settings{" "}
                    </span>
                    <span onClick={() => deleteWidget(widget)} className={styles.action}>
                        <Icon icon={"trash-alt"} /> Delete{" "}
                    </span>
                </div>
                {editorWidget.widget.renderWidget({ widget, onChange })}
            </div>
        );
    }
}

export default createComponent(PreviewWidget, { services: ["cms"] });
