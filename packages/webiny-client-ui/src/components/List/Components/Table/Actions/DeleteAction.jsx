import React from "react";
import _ from "lodash";
import { inject, i18n } from "webiny-client";
import ModalAction from "./ModalAction";

const t = i18n.namespace("Webiny.Ui.List.Table.Actions");
@inject({ modules: ["Modal"] })
class DeleteAction extends React.Component {
    constructor() {
        super();
        this.dialogId = _.uniqueId("delete-action-modal-");
    }

    shouldComponentUpdate(props) {
        return !_.isEqual(props.data, this.props.data);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { message, modules: { Modal: { Confirmation } } } = this.props;
        const $this = this;

        return (
            <ModalAction
                {..._.pick(this.props, "data", "actions", "label", "hide", "afterDelete", "icon")}
            >
                {function render({ data, actions, dialog }) {
                    const props = {
                        name: $this.dialogId,
                        title: $this.props.title,
                        confirm: $this.props.confirmButtonLabel,
                        cancel: $this.props.cancelButtonLabel,
                        message,
                        onComplete: () => {
                            actions.loadRecords();
                        },
                        onConfirm: () => {
                            $this.props.onConfirm.call($this, { data, actions, dialog });
                        }
                    };
                    return <Confirmation {...props} />;
                }}
            </ModalAction>
        );
    }
}

DeleteAction.defaultProps = {
    label: t`Delete`,
    title: t`Delete confirmation`,
    icon: ["fas", "times"],
    message: t`Are you sure you want to delete this record?`,
    confirmButtonLabel: t`Yes, delete!`,
    cancelButtonLabel: t`No`,
    hide: _.noop,
    afterDelete: _.noop,
    onConfirm({ data, actions }) {
        return actions.deleteRecord(data.id).then(res => {
            return Promise.resolve(this.props.afterDelete(res)).then(() => res);
        });
    }
};

export default DeleteAction;
