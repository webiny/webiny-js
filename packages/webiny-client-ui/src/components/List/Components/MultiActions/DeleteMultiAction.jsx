import React from 'react';
import _ from 'lodash';
import { app, createComponent, i18n } from 'webiny-client';
import ModalMultiAction from './ModalMultiAction';

const t = i18n.namespace("Webiny.Ui.List.MultiActions.DeleteMultiAction");
class DeleteMultiAction extends React.Component {

    constructor(props) {
        super(props);

        this.dialogId = _.uniqueId('delete-multi-action-modal-');

        ['delete', 'formatMessage'].map(m => this[m] = this[m].bind(this));
    }

    formatMessage() {
        const { message, data } = this.props;
        if (_.isFunction(message)) {
            return message({ data });
        }
        return this.props.message.replace('{count}', this.props.data.length);
    }

    delete({ data, actions, dialog }) {
        const { api } = this.props.actions;
        return api.post(api.defaults.url + '/delete', { ids: _.map(data, 'id') }).then(response => {
            const growler = app.services.get('growler');
            if (response.statusCode >= 200) {
                growler.success(t`{count} records deleted successfully!`({ count: data.length }));
                actions.reload();
            } else {
                growler.danger(_.get(response, 'data.message', response.statusText), t`Delete failed`, true);
            }
            return dialog.hide();
        });
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { modules: { Modal }, actions, label, data, children } = this.props;

        const content = _.isFunction(children) ? children : ({ data, actions, dialog }) => {
            const props = {
                name: this.dialogId,
                title: this.props.title,
                message: this.formatMessage(),
                onConfirm: () => this.props.onConfirm.call(this, { data, actions, dialog })
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
}

DeleteMultiAction.defaultProps = {
    label: t`Delete`,
    title: t`Delete confirmation`,
    message: t`Do you really want to delete {count} record(s)?`,
    actions: null,
    data: [],
    onConfirm(params) {
        return this.delete(params);
    }
};

export default createComponent(DeleteMultiAction, { modules: ['Modal'] });