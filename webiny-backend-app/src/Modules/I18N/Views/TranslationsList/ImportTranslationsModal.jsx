import React from 'react';
import {Webiny} from 'webiny-client';
import _ from 'lodash';

/**
 * @i18n.namespace Webiny.Backend.I18N.ImportTranslationsModal
 */
class ImportTranslationsModal extends Webiny.Ui.ModalComponent {
    renderDialog() {
        const {Ui} = this.props;

        return (
            <Ui.Modal.Dialog>
                <Ui.Form
                    api="/entities/webiny/i18n-texts"
                    url="/translations/import"
                    defaultModel={{options: {}, results: null}}
                    onSubmit={async ({model, form}) => {
                        form.showLoading();
                        const preview = model.options.preview;
                        form.setModel({response: null});
                        const extension = model.file.name.split('.').pop();
                        const response = await form.api.post('/translations/import/' + extension, model);
                        form.hideLoading();

                        if (response.isError()) {
                            return form.handleApiError(response);
                        }

                        form.setModel({results: {preview, data: response.getData()}}, () => !preview && this.props.onTranslationsImported());
                    }}>
                    {({model, form}) => {
                        let results = null;
                        if (model.results) {
                            if (model.results.preview) {
                                results = (
                                    <Ui.Alert>
                                        {this.i18n('Export file is valid. After importing, following changes will be applied:')}
                                        <ul>
                                            <li>{this.i18n('{num} created', {num: <strong>{model.results.data.created}</strong>})}</li>
                                            <li>{this.i18n('{num} updated', {num: <strong>{model.results.data.updated}</strong>})}</li>
                                            <li>{this.i18n('{num} ignored', {num: <strong>{model.results.data.ignored}</strong>})}</li>
                                        </ul>
                                    </Ui.Alert>
                                );
                            } else {
                                results = (
                                    <Ui.Alert type="success">
                                        {this.i18n('Translations were successfully imported! Following changes were applied:')}
                                        <ul>
                                            <li>{this.i18n('{num} created', {num: <strong>{model.results.data.created}</strong>})}</li>
                                            <li>{this.i18n('{num} updated', {num: <strong>{model.results.data.updated}</strong>})}</li>
                                            <li>{this.i18n('{num} ignored', {num: <strong>{model.results.data.ignored}</strong>})}</li>
                                        </ul>
                                    </Ui.Alert>
                                );
                            }
                        }
                        return (
                            <Ui.Modal.Content>
                                <Ui.Form.Loader/>
                                <Ui.Modal.Header title={this.i18n(`Import translations`)} onClose={this.hide}/>
                                <Ui.Modal.Body>
                                    <Ui.Form.Error/>
                                    {results}
                                    <Ui.Grid.Row>
                                        <Ui.Grid.Col all={12}>
                                            <Ui.File
                                                validate="required"
                                                placeholder={this.i18n('JSON or YAML file')}
                                                label={this.i18n('Choose File')}
                                                name="file"/>
                                        </Ui.Grid.Col>
                                    </Ui.Grid.Row>

                                    <Ui.Section title={this.i18n('Options')}/>
                                    <Ui.Grid.Row>
                                        <Ui.Grid.Col all={12}>
                                            <Ui.Checkbox name="options.preview" label={this.i18n('Preview')}/>
                                        </Ui.Grid.Col>
                                    </Ui.Grid.Row>

                                </Ui.Modal.Body>
                                <Ui.Modal.Footer >
                                    <Ui.Button label={this.i18n(`Cancel`)} onClick={this.hide}/>
                                    <Ui.Button
                                        type="primary"
                                        label={this.i18n(`Import`)}
                                        onClick={form.submit}/>
                                </Ui.Modal.Footer>
                            </Ui.Modal.Content>
                        );
                    }}
                </Ui.Form>
            </Ui.Modal.Dialog>
        );
    }
}

ImportTranslationsModal.defaultProps = _.assign({}, Webiny.Ui.ModalComponent.defaultProps, {
    onTranslationsImported: _.noop
});

export default Webiny.createComponent(ImportTranslationsModal, {
    modulesProp: 'Ui',
    modules: ['Modal', 'Form', 'Grid', 'Checkbox', 'Button', 'File', 'Section', 'Alert']
});