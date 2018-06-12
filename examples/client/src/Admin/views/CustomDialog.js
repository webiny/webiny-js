import React from "react";
import { app, createComponent } from "webiny-client";
import { ModalComponent } from "webiny-client-ui";

class CustomDialog extends React.Component {
    render() {
        const { Modal, Button } = this.props.modules;
        return (
            <Modal.Dialog>
                <Modal.Content>
                    <Modal.Header title="My Modal" onClose={this.props.hide} />
                    <Modal.Body>Your modal dialog content!</Modal.Body>
                    <Modal.Footer align="right">
                        <Button type="default" label="Close" onClick={this.props.hide} />
                    </Modal.Footer>
                </Modal.Content>
            </Modal.Dialog>
        );
    }
}

export default createComponent([CustomDialog, ModalComponent], { modules: ["Modal", "Button"] });
