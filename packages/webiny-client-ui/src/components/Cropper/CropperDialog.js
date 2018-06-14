import React from "react";
import { Component } from "webiny-client";
import { withModalDialog } from "webiny-client-ui";

@withModalDialog()
@Component({ modules: ["Modal"] })
class CropperDialog extends React.Component {
    render() {
        const {
            modules: { Modal },
            children,
            ...props
        } = this.props;
        return <Modal.Dialog {...props}>{children}</Modal.Dialog>;
    }
}

export default CropperDialog;
