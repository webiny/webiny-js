import React from 'react';
import {Webiny} from 'webiny-client';
import _ from 'lodash';

/**
 * @i18n.namespace Webiny.Backend.I18N.ExportTextsModal
 */
class ExportTextsModal extends Webiny.Ui.ModalComponent {
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
                <Ui.Form>
                    {({model}) => {
                        const availableGroups = this.getAvailableGroups(model.apps);
                        return (
                            <Ui.Modal.Content>
                                <Ui.Form.Loader/>
                                <Ui.Modal.Header title={this.i18n(`Export texts`)} onClose={this.hide}/>
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
                                </Ui.Modal.Body>
                                <Ui.Modal.Footer >
                                    <Ui.Button label={this.i18n(`Cancel`)} onClick={this.hide}/>
                                    <Ui.DownloadLink
                                        separate
                                        disabled={_.isEmpty(model.apps)}
                                        onClick={() => this.hide()}
                                        method="POST"
                                        params={model}
                                        type="primary"
                                        download={Webiny.Config.ApiUrl + '/entities/webiny/i18n-texts/export/json'}>
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

ExportTextsModal.defaultProps = _.assign({}, Webiny.Ui.ModalComponent.defaultProps);

export default Webiny.createComponent(ExportTextsModal, {
    modulesProp: 'Ui',
    modules: [
        'Modal', 'Form', 'Grid', 'CheckboxGroup', 'Checkbox', 'Button', 'DownloadLink'
    ]
});