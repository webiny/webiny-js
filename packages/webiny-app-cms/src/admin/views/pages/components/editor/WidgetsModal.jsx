import React from "react";
import { app, createComponent } from "webiny-app";
import { ModalComponent } from "webiny-app-ui";
import styles from "./WidgetsModal.scss";

class WidgetsModal extends React.Component {
    renderWidget({ icon, title, origin, type, data, settings }) {
        const { modules: { Icon }, onSelect } = this.props;
        return (
            <li
                key={origin || type}
                onClick={() =>
                    this.props.hide().then(() => onSelect({ origin, type, data, settings }))
                }
            >
                <a href="#">
                    <span className={styles.icon}>
                        <Icon icon={icon} />
                    </span>
                    <span className={styles.txt}>{title}</span>
                </a>
            </li>
        );
    }

    render() {
        const { modules: { Modal, Button, Tabs}, services: { cms } } = this.props;

        return (
            <Modal.Dialog>
                <Modal.Content>
                    <Modal.Header title="ADD WIDGET" onClose={this.props.hide} />
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
    modules: ["Modal", "Button", "Tabs", "Icon"],
    services: ["cms"]
});
