import React from "react";
import { app, createComponent } from "webiny-app";
import { ModalComponent } from "webiny-app-ui";

class MakeLocalDialog extends React.Component {
    render() {
        const { Modal, Button } = this.props.modules;
        return (
            <Modal.Dialog>
                <Modal.Content>
                    <Modal.Header title="Make widget global" onClose={this.props.hide} />
                    <Modal.Body>Your modal dialog content!</Modal.Body>
                    <Modal.Footer align="right">
                        <Button type="default" label="Close" onClick={this.props.hide} />
                    </Modal.Footer>
                </Modal.Content>
            </Modal.Dialog>
        );
    }
}

export default createComponent([MakeLocalDialog, ModalComponent], { modules: ["Modal", "Button"] });
