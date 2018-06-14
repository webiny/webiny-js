import React from "react";
import classSet from "classnames";
import { inject } from "webiny-client";
import { WidgetContainer } from "webiny-client-cms";
import styles from "./Widget.scss?prefix=wby-cms-editor-widget";

@inject({modules: ["Form", "Icon"], services: ["cms"] })
class Widget extends React.Component {
    render() {
        const {
            moveUp,
            moveDown,
            selectWidget,
            editWidget,
            deleteWidget,
            widget,
            onChange,
            modules: { Icon, Form },
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
                    <span onClick={selectWidget} className={styles.action}>
                        <Icon icon={"plus-circle"} /> Add widget{" "}
                    </span>
                </div>
                <Form model={widget.data || {}} onChange={onChange}>
                    {({ model, Bind }) =>
                        React.cloneElement(
                            editorWidget.widget.renderWidget({
                                WidgetContainer,
                                widget
                            }),
                            {
                                Bind,
                                widget,
                                onChange
                            }
                        )
                    }
                </Form>
            </div>
        );
    }
}

export default Widget;
