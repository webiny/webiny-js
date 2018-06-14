import React from "react";
import { inject } from "webiny-client";
import { withModalDialog } from "webiny-client-ui";

@withModalDialog()
@inject({ modules: ["Modal"] })
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
