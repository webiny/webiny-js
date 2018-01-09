import {Webiny} from 'webiny-client';
import React from 'react';

class NotificationModal extends Webiny.Ui.ModalComponent {
    constructor(props) {
        super(props);

        this.plugins = this.getPlugins();
    }

    getPlugins() {
        const {Draft} = this.props;
        return [
            new Draft.Plugins.Heading(),
            new Draft.Plugins.Bold(),
            new Draft.Plugins.Italic(),
            new Draft.Plugins.Underline(),
            new Draft.Plugins.UnorderedList(),
            new Draft.Plugins.OrderedList(),
            new Draft.Plugins.Alignment(),
            new Draft.Plugins.Link(),
            new Draft.Plugins.Blockquote(),
            new Draft.Plugins.Image()
        ];
    }

    renderDialog() {
        const {Modal, Button, Filters, Draft, notification} = this.props;
        let content = notification.text;
        if (notification.data.draft) {
            content = (
                <Draft.Editor value={notification.data.draft} preview toolbar={false} plugins={this.plugins}/>
            );
        }

        return (
            <Modal.Dialog>
                <Modal.Content>
                    <Modal.Header title={notification.subject}/>
                    <Modal.Body>
                        {content}
                        <br/>
                        Created: <Filters.TimeAgo value={notification.createdOn}/>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button label="Close" onClick={this.hide}/>
                    </Modal.Footer>
                </Modal.Content>
            </Modal.Dialog>
        );
    }
}

export default Webiny.createComponent(NotificationModal, {modules: ['Modal', 'Button', 'Filters', 'Draft']});