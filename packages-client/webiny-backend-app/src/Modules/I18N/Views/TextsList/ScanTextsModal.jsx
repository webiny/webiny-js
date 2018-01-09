import React from 'react';
import {Webiny} from 'webiny-client';
import _ from 'lodash';

/**
 * @i18n.namespace Webiny.Backend.I18N.ScanTexts
 */
class ScanTextsModal extends Webiny.Ui.ModalComponent {
    renderDialog() {
        const {Ui} = this.props;

        return (
            <Ui.Modal.Dialog>
                <Ui.Form
                    defaultModel={{apps: [], options: {overwriteExisting: false}}}
                    api="/entities/webiny/i18n-texts"
                    onSubmit={async ({model, form}) => {
                        form.showLoading();
                        const preview = model.options.preview;
                        form.setModel({response: null});
                        const response = await form.api.post('/scan', {apps: model.apps, options: model.options});

                        form.hideLoading();

                        if (response.isError()) {
                            return form.handleApiError(response);
                        }

                        form.setModel({results: {preview, data: response.getData()}}, () => !preview && this.props.onTextsScanned());
                    }}>
                    {({model, form}) => {
                        let results = null;
                        if (model.results) {
                            if (model.results.preview) {
                                results = (
                                    <Ui.Alert>
                                        {this.i18n('After scan, following changes will be applied:')}
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
                                        {this.i18n('Texts were successfully scanned! Following changes were applied:')}
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
                                <Ui.Modal.Header title={this.i18n(`Scan Texts`)} onClose={this.hide}/>
                                <Ui.Modal.Body>
                                    <Ui.Form.Error/>
                                    {results}
                                    <Ui.Grid.Row>
                                        <Ui.Grid.Col all={12}>
                                            <Ui.CheckboxGroup
                                                validate="required"
                                                name="apps"
                                                label={this.i18n('Select apps to scan for texts')}
                                                api="/services/webiny/apps"
                                                url="/installed"
                                                textAttr="name"
                                                valueAttr="name"/>
                                        </Ui.Grid.Col>
                                    </Ui.Grid.Row>

                                    <Ui.Section title={this.i18n('Options')}/>
                                    <Ui.Grid.Row>
                                        <Ui.Grid.Col all={12}>
                                            <Ui.Checkbox
                                                name="options.overwriteExisting"
                                                label={this.i18n('Overwrite existing keys')}
                                                tooltip={this.i18n('Previously scanned texts will be overwritten.')}/>
                                            <Ui.Checkbox
                                                name="options.preview"
                                                label={this.i18n('Preview')}/>
                                        </Ui.Grid.Col>
                                    </Ui.Grid.Row>

                                </Ui.Modal.Body>
                                <Ui.Modal.Footer >
                                    <Ui.Button label={this.i18n(`Cancel`)} onClick={this.hide}/>
                                    <Ui.Button
                                        disabled={_.isEmpty(model.apps)}
                                        type="primary"
                                        label={this.i18n(`Scan`)}
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

ScanTextsModal.defaultProps = _.assign({}, Webiny.Ui.ModalComponent.defaultProps, {
    onTextsScanned: _.noop
});

export default Webiny.createComponent(ScanTextsModal, {
    modulesProp: 'Ui',
    modules: [
        'Modal', 'Form', 'Grid', 'CheckboxGroup', 'Checkbox', 'Button', 'Section', 'DownloadLink', 'Alert'
    ]
});