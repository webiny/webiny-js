import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace  Webiny.Backend.I18N.TextGroupModal
 */
class TextGroupModal extends Webiny.Ui.ModalComponent {
    renderDialog() {
        const {Ui} = this.props;

        return (
            <Ui.Modal.Dialog>
                <Ui.Form
                    id={_.get(this.props, 'data.id')}
                    api="/entities/webiny/i18n-text-groups"
                    fields="name,description,app"
                    onSuccessMessage={() => {
                        this.i18n('Text group saved successfully.')
                    }}
                    onSubmitSuccess={() => this.hide().then(this.props.onSubmitSuccess)}>
                    {({form}) => {
                        const id = _.get(this.props, 'data.id');
                        return (
                            <Ui.Modal.Content>
                                <Ui.Form.Loader/>
                                <Ui.Modal.Header
                                    title={id ? this.i18n('Edit text group') : this.i18n('Create text group')}
                                    onClose={this.hide}/>
                                <Ui.Modal.Body>
                                    <Ui.Form.Error/>
                                    <Ui.Grid.Row>
                                        <Ui.Grid.Col all={12}>
                                            <Ui.Input
                                                label={this.i18n('Name')}
                                                placeholder={this.i18n('Name of text group')}
                                                name="name"
                                                validate="required"/>
                                        </Ui.Grid.Col>
                                    </Ui.Grid.Row>
                                    <Ui.Grid.Row>
                                        <Ui.Grid.Col all={12}>
                                            <Ui.Select
                                                label={this.i18n('App')}
                                                name="app"
                                                api="/services/webiny/apps"
                                                validate="required"
                                                url="/installed"
                                                textAttr="name"
                                                valueAttr="name"
                                                placeholder={this.i18n('Select an app...')}
                                                allowClear/>
                                        </Ui.Grid.Col>
                                    </Ui.Grid.Row>
                                    <Ui.Grid.Row>
                                        <Ui.Grid.Col all={12}>
                                            <Ui.Textarea
                                                label={this.i18n(`Description`)}
                                                name="description"
                                                placeholder={this.i18n('Short description...')}/>
                                        </Ui.Grid.Col>
                                    </Ui.Grid.Row>
                                </Ui.Modal.Body>
                                <Ui.Modal.Footer>
                                    <Ui.Button label={this.i18n('Cancel')} onClick={this.hide}/>
                                    <Ui.Button type="primary" label={this.i18n('Save')} onClick={form.submit}/>
                                </Ui.Modal.Footer>
                            </Ui.Modal.Content>
                        );
                    }}
                </Ui.Form>
            </Ui.Modal.Dialog>
        );
    }
}

TextGroupModal.defaultProps = Webiny.Ui.ModalComponent.extendProps({
    data: null,
    onSubmitSuccess: _.noop
});

export default Webiny.createComponent(TextGroupModal, {
    modulesProp: 'Ui',
    modules: ['Modal', 'Form', 'Grid', 'Input', 'Button', 'Textarea', 'Select']
});
