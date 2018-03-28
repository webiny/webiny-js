import React from 'react';
import {Webiny} from 'webiny-app';

class Dialog extends Webiny.Ui.Component {
    componentDidUpdate(prevProps, prevState) {
        super.componentDidUpdate(prevProps, prevState);
        if (!prevProps.show && this.props.show) {
            this.refs.dialog.show();
        }
    }
}

Dialog.defaultProps = {
    renderer() {
        const dialogProps = {
            ref: 'dialog',
            onHidden: this.props.onHidden
        };

        const funcParams = {
            download: this.props.download
        };

        return (
            <webiny-download-dialog>
                {React.cloneElement(this.props.renderDialog(funcParams), dialogProps)}
            </webiny-download-dialog>
        );
    }
};

export default Dialog;