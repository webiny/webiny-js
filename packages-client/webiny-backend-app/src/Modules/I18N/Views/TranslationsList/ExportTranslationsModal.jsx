import React from 'react';
import {Webiny} from 'webiny-client';
import _ from 'lodash';

/**
 * @i18n.namespace Webiny.Backend.I18N.ExportTranslationsModal
 */
class ExportTranslationsModal extends Webiny.Ui.ModalComponent {
    constructor() {
        super();
        this.state = {groups: []};
    }

    componentWillMount() {
        super.componentWillMount();
        Webiny.I18n.getTextGroups().then(groups => this.setState({groups}));
    }

    getAvailableGroups(apps) {
        const output = [{id: 'none', name: 'Texts without group'}];
        this.state.groups.forEach(group => {
            if (_.includes(apps, group.app)) {
                output.push(group);
            }
        });

        return output;
    }

    renderDialog() {
        const {Ui} = this.props;

        return (
            <Ui.Modal.Dialog>
                <Ui.Form defaultModel={{fileType: 'json'}}>
                    {({model}) => {
                        const availableGroups = this.getAvailableGroups(model.apps);
                        const downloadUrl = `${Webiny.Config.ApiUrl}/entities/webiny/i18n-texts/translations/export/${model.fileType}`;

                        return (
                            <Ui.Modal.Content>
                                <Ui.Form.Loader/>
                                <Ui.Modal.Header title={this.i18n(`Export translations`)} onClose={this.hide}/>
                                <Ui.Modal.Body>
                                    <Ui.Form.Error/>
                                    <Ui.Grid.Row>
                                        <Ui.Grid.Col all={12}>
                                            <Ui.CheckboxGroup
                                                validate="required"
                                                name="apps"
                                                label={this.i18n('Select apps to export')}
                                                api="/services/webiny/apps"
                                                url="/installed"
                                                textAttr="name"
                                                valueAttr="name"/>
                                        </Ui.Grid.Col>
                                    </Ui.Grid.Row>
                                    {!_.isEmpty(availableGroups) && (
                                        <Ui.Grid.Row>
                                            <Ui.Grid.Col all={12}>
                                                <Ui.CheckboxGroup
                                                    tooltip={this.i18n('Only groups from selected apps are shown.')}
                                                    validate="required"
                                                    name="groups"
                                                    textAttr="name"
                                                    options={availableGroups}
                                                    label={this.i18n('Select groups to export')}/>
                                            </Ui.Grid.Col>
                                        </Ui.Grid.Row>
                                    )}
                                    <Ui.Grid.Row>
                                        <Ui.Grid.Col all={12}>
                                            <Ui.CheckboxGroup
                                                validate="required"
                                                sort="key"
                                                name="locales"
                                                fields="id,label,key"
                                                textAttr="label"
                                                valueAttr="key"
                                                label={this.i18n('Select locales to export')}
                                                api="/entities/webiny/i18n-locales"/>
                                        </Ui.Grid.Col>
                                    </Ui.Grid.Row>
                                    <Ui.Grid.Row>
                                        <Ui.Grid.Col all={12}>
                                            <Ui.RadioGroup name="fileType" label={this.i18n('Select export file type')}>
                                                <option value="json">{this.i18n('JSON')}</option>
                                                <option value="yaml">{this.i18n('YAML')}</option>
                                            </Ui.RadioGroup>
                                        </Ui.Grid.Col>
                                    </Ui.Grid.Row>
                                </Ui.Modal.Body>
                                <Ui.Modal.Footer >
                                    <Ui.Button label={this.i18n(`Cancel`)} onClick={this.hide}/>
                                    <Ui.DownloadLink
                                        separate
                                        disabled={_.isEmpty(model.apps) || _.isEmpty(model.groups) || _.isEmpty(model.locales)}
                                        onClick={() => this.hide()}
                                        method="POST"
                                        params={model}
                                        type="primary"
                                        download={downloadUrl}>
                                        {this.i18n(`Export`)}
                                    </Ui.DownloadLink>
                                </Ui.Modal.Footer>
                            </Ui.Modal.Content>
                        );
                    }}
                </Ui.Form>
            </Ui.Modal.Dialog>
        );
    }
}

ExportTranslationsModal.defaultProps = _.assign({}, Webiny.Ui.ModalComponent.defaultProps);

export default Webiny.createComponent(ExportTranslationsModal, {
    modulesProp: 'Ui',
    modules: [
        'Modal', 'Form', 'Grid', 'CheckboxGroup', 'Checkbox', 'Button', 'DownloadLink', 'RadioGroup'
    ]
});