import React from 'react';
import {Webiny} from 'webiny-client';
import _ from 'lodash';

/**
 * @i18n.namespace Webiny.Backend.I18N.ImportTexts
 */
class ImportTextsModal extends Webiny.Ui.ModalComponent {
    renderDialog() {
        const {Ui} = this.props;

        return (
            <Ui.Modal.Dialog>
                <Ui.Form 
                    api="/entities/webiny/i18n-texts"
                    url="/import/zip"
                    defaultModel={{options: {overwriteExisting: true}}}
                    onSubmit={async ({model, form}) => {
                        form.showLoading();
                        const preview = model.options.preview;
                        form.setModel({response: null});
                        const response = await form.api.post('/import/json', model);
                        form.hideLoading();

                        if (response.isError()) {
                            return form.handleApiError(response);
                        }

                        form.setModel({results: {preview, data: response.getData()}}, () => !preview && this.props.onTextsImported());
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
                                        {this.i18n('The following changes will be applied to text groups:')}
                                        <ul>
                                            <li>{this.i18n('{num} created', {num: <strong>{model.results.data.groups.created}</strong>})}</li>
                                            <li>{this.i18n('{num} updated', {num: <strong>{model.results.data.groups.updated}</strong>})}</li>
                                            <li>{this.i18n('{num} ignored', {num: <strong>{model.results.data.groups.ignored}</strong>})}</li>
                                        </ul>
                                    </Ui.Alert>
                                );
                            } else {
                                results = (
                                    <Ui.Alert type="success">
                                        {this.i18n('Translations were successfully imported! following changes were applied:')}
                                        <ul>
                                            <li>{this.i18n('{num} created', {num: <strong>{model.results.data.created}</strong>})}</li>
                                            <li>{this.i18n('{num} updated', {num: <strong>{model.results.data.updated}</strong>})}</li>
                                            <li>{this.i18n('{num} ignored', {num: <strong>{model.results.data.ignored}</strong>})}</li>
                                        </ul>
                                        {this.i18n('The following changes were applied to text groups:')}
                                        <ul>
                                            <li>{this.i18n('{num} created', {num: <strong>{model.results.data.groups.created}</strong>})}</li>
                                            <li>{this.i18n('{num} updated', {num: <strong>{model.results.data.groups.updated}</strong>})}</li>
                                            <li>{this.i18n('{num} ignored', {num: <strong>{model.results.data.groups.ignored}</strong>})}</li>
                                        </ul>
                                    </Ui.Alert>
                                );
                            }
                        }

                        return (
                            <Ui.Modal.Content>
                                <Ui.Form.Loader/>
                                <Ui.Modal.Header title={this.i18n(`Import texts`)} onClose={this.hide}/>
                                <Ui.Modal.Body>
                                    <Ui.Form.Error/>
                                    {results}
                                    <Ui.Grid.Row>
                                        <Ui.Grid.Col all={12}>
                                            <Ui.File
                                                validate="required"
                                                placeholder={this.i18n('JSON file')}
                                                label={this.i18n('Choose File')}
                                                name="file"
                                                accept={['application/json']}/>
                                        </Ui.Grid.Col>
                                    </Ui.Grid.Row>

                                    <Ui.Section title={this.i18n('Options')}/>
                                    <Ui.Grid.Row>
                                        <Ui.Grid.Col all={12}>
                                            <Ui.Checkbox
                                                name="options.overwriteExisting"
                                                label={this.i18n('Overwrite existing keys')}
                                                tooltip={this.i18n('Previously imported texts will be overwritten.')}/>
                                            <Ui.Checkbox
                                                name="options.preview"
                                                label={this.i18n('Preview')}/>
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
                    }
                    }
                </Ui.Form>
            </Ui.Modal.Dialog>
        );
    }
}

ImportTextsModal.defaultProps = _.assign({}, Webiny.Ui.ModalComponent.defaultProps, {
    onTextsImported: _.noop
});

export default Webiny.createComponent(ImportTextsModal, {
    modulesProp: 'Ui',
    modules: [
        'Modal', 'Form', 'Grid', 'CheckboxGroup', 'Checkbox', 'Button', 'File', 'Section', 'Alert'
    ]
});