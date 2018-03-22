import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import ModalMultiAction from './ModalMultiAction';

/**
 * @i18n.namespace Webiny.Ui.List.MultiActions.DeleteMultiAction
 */
class DeleteMultiAction extends Webiny.Ui.Component {

    constructor(props) {
        super(props);
        this.bindMethods('delete,formatMessage');
    }

    formatMessage() {
        const {message, data} = this.props;
        if (_.isFunction(message)) {
            return message({data});
        }
        return this.props.message.replace('{count}', this.props.data.length);
    }

    delete({data, actions, dialog}) {
        return this.props.actions.api.post('delete', {ids: _.map(data, 'id')}).then(res => {
            if (!res.isError()) {
                Webiny.Growl.success(this.i18n('{count} records deleted successfully!', {count: data.length}));
                actions.reload();
            } else {
                Webiny.Growl.danger(res.getError(), this.i18n('Delete failed'), true);
            }
            return dialog.hide();
        });
    }
}

DeleteMultiAction.defaultProps = {
    label: Webiny.I18n('Delete'),
    title: Webiny.I18n('Delete confirmation'),
    message: Webiny.I18n('Do you really want to delete {count} record(s)?'),
    actions: null,
    data: [],
    onConfirm(params) {
        return this.delete(params);
    },
    renderer() {
        const {Modal, actions, label, data, children} = this.props;

        const content = _.isFunction(children) ? children : ({data, actions, dialog}) => {
            const props = {
                title: this.props.title,
                message: this.formatMessage(),
                onConfirm: () => this.props.onConfirm.call(this, {data, actions, dialog})
            };
            return (
                <Modal.Confirmation {...props}/>
            );
        };

        return (
            <ModalMultiAction actions={actions} label={label} data={data}>
                {content}
            </ModalMultiAction>
        );
    }
};

export default Webiny.createComponent(DeleteMultiAction, {modules: ['Modal']});