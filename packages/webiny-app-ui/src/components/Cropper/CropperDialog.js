import React from "react";
import { createComponent } from "webiny-app";
import { ModalComponent } from "webiny-app-ui";

class CropperDialog extends React.Component {
    render() {
        const { modules: { Modal }, children, ...props } = this.props;
        return <Modal.Dialog {...props}>{children}</Modal.Dialog>;
    }
}

export default createComponent([CropperDialog, ModalComponent], { modules: ["Modal"] });
