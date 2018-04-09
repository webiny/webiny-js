import React from "react";
import { app, createComponent } from "webiny-app";
import { ModalComponent } from "webiny-app-ui";
import styles from "./WidgetsModal.scss";

class WidgetsModal extends React.Component {
    renderWidget(widget) {
        const { Icon, onSelect } = this.props;
        return (
            <li key={widget.type} onClick={() => this.props.hide().then(() => onSelect(widget))}>
                <a href="#">
                    <span className={styles.icon}>
                        <Icon icon={widget.icon} />
                    </span>
                    <span className={styles.txt}>{widget.title}</span>
                </a>
            </li>
        );
    }
    render() {
        const { Modal, Button, Tabs } = this.props.modules;
        const cms = app.services.get("cms");

        return (
            <Modal.Dialog>
                <Modal.Content>
                    <Modal.Header title="ADD NEW WIDGET" onClose={this.props.hide} />
                    <Modal.Body>
                        <Tabs position={"left"}>
                            {cms.getWidgetGroups().map(({ name, title, icon }) => {
                                return (
                                    <Tabs.Tab key={name} label={title} icon={icon}>
                                        <div className={styles.widgets}>
                                            <ul>
                                                {cms
                                                    .getEditorWidgets(name)
                                                    .map(this.renderWidget.bind(this))}
                                            </ul>
                                        </div>
                                    </Tabs.Tab>
                                );
                            })}
                        </Tabs>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button type="default" label="Cancel" onClick={this.props.hide} />
                    </Modal.Footer>
                </Modal.Content>
            </Modal.Dialog>
        );
    }
}

export default createComponent([WidgetsModal, ModalComponent], {
    modules: ["Modal", "Button", "Tabs", "Icon"]
});
