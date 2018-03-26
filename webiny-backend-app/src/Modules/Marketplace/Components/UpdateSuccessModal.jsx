import React from 'react';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Backend.Marketplace.UpdateSuccessModal
 */
class UpdateSuccessModal extends Webiny.Ui.ModalComponent {

    constructor(props){
        super(props);

        this.bindMethods('getButton');
    }

    getButton(dialog) {
        const {Button} = this.props;
        return (
            <Button type="secondary" label={this.i18n('Reload window')} icon="fa-reload" onClick={() => dialog.hide().then(() => window.location.reload())}/>
        );
    }

    renderDialog() {
        const {Modal, app} = this.props;

        return (
            <Modal.Success closeBtn={this.getButton} onClose={() => window.location.reload()}>
                {this.i18n(`{appName} was updated successfully!`, {appName: <strong>{app.name}</strong>})}
                <br/><br/>
                {this.i18n('To see the changes you need to reload this browser window.')}<br/>
                {this.i18n('Click the button below to reload.')}
            </Modal.Success>
        );
    }
}

export default Webiny.createComponent(UpdateSuccessModal, {modules: ['Modal', 'Button']});