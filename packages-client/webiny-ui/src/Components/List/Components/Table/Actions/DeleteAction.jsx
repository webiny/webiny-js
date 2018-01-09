import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import ModalAction from './ModalAction';

/**
 * @i18n.namespace Webiny.Ui.List.Table.Actions
 */
class DeleteAction extends Webiny.Ui.Component {

}

DeleteAction.defaultProps = {
    label: Webiny.I18n('Delete'),
    title: Webiny.I18n('Delete confirmation'),
    icon: 'icon-cancel',
    message: Webiny.I18n('Are you sure you want to delete this record?'),
    confirmButtonLabel: Webiny.I18n('Yes, delete!'),
    cancelButtonLabel: Webiny.I18n('No'),
    hide: _.noop,
    afterDelete: _.noop,
    onConfirm({data, actions, dialog}) {
        return actions.delete(data.id, false).then(res => {
            return Promise.resolve(this.props.afterDelete(res)).then(() => res);
        });
    },
    renderer() {
        const {message, Modal} = this.props;
        const $this = this;

        return (
            <ModalAction {..._.pick(this.props, 'data', 'actions', 'label', 'hide', 'afterDelete', 'icon')}>
                {function render({data, actions, dialog}) {
                    const props = {
                        title: $this.props.title,
                        confirm: $this.props.confirmButtonLabel,
                        cancel: $this.props.cancelButtonLabel,
                        message,
                        onComplete: () => {
                            actions.reload();
                        },
                        onConfirm: () => {
                            $this.props.onConfirm.call($this, {data, actions, dialog});
                        }
                    };
                    return (
                        <Modal.Confirmation {...props}/>
                    );
                }}
            </ModalAction>
        );
    }
};

export default Webiny.createComponent(DeleteAction, {modules: ['Modal']});