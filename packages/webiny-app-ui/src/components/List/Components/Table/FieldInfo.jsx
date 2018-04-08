import React from 'react';
import { createComponent, i18n } from 'webiny-app';

const t = i18n.namespace("Webiny.Ui.List.Table.FieldInfo");
class FieldInfo extends React.Component {

    constructor(props) {
        super(props);

        ['showInfo', 'hideInfo'].map(m => this[m] = this[m].bind(this));
    }

    showInfo() {
        this.refs.dialog.show();
    }

    hideInfo() {
        this.refs.dialog.hide();
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { Icon } = this.props;

        const info = (
            <a onClick={this.showInfo} href="javascript:void(0);">
                <Icon icon="icon-info"/>
            </a>
        );

        const { Button, Modal } = this.props;

        const modal = (
            <Modal.Dialog ref="dialog">
                <Modal.Content>
                    <Modal.Header title={this.props.title}/>
                    <Modal.Body children={this.props.children}/>
                    <Modal.Footer>
                        <Button label={t`Close`} onClick={this.hideInfo}/>
                    </Modal.Footer>
                </Modal.Content>
            </Modal.Dialog>
        );

        return (
            <webiny-field-info>
                {info}
                {modal}
            </webiny-field-info>
        );
    }
}

export default createComponent(FieldInfo, { modules: ['Modal', 'Button', 'Icon'] });