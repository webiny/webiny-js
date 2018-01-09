import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Backend.Acl.Modal.ApiTokenModal
 */
class ApiTokenModal extends Webiny.Ui.ModalComponent {

    renderDialog() {
        const {Modal, Form, Grid, Input, Switch, Button, Tabs, UserRoles, UserRoleGroups} = this.props;

        const formProps = {
            api: '/entities/webiny/api-token',
            fields: '*,roles[id],roleGroups[id]',
            id: _.get(this.props.data, 'id'),
            onSubmitSuccess: () => {
                this.props.refreshTokens();
                this.hide();
            },
            onSuccessMessage: () => {
                return `Token was saved successfully!`;
            },
            defaultModel: this.props.data
        };

        return (
            <Modal.Dialog wide={true}>
                {({dialog}) => (
                    <Form {...formProps}>
                        {({model, form}) => (
                            <Modal.Content>
                                <Form.Loader/>
                                <Modal.Header title={this.i18n('API Token')} onClose={dialog.hide}/>
                                <Modal.Body>
                                    <Grid.Row>
                                        <Grid.Col all={12}>
                                            <Form.Error/>
                                            <Input readOnly label={this.i18n('Token')} name="token" renderIf={() => model.id}/>
                                            <Input label={this.i18n('Owner')} name="owner" validate="required" placeholder={this.i18n('Eg: webiny.com')}/>
                                            <Input
                                                label={this.i18n('Description')}
                                                name="description"
                                                validate="required"
                                                description={<span>{this.i18n(`Try to keep it short, for example: {example}`, {example: <strong>Project X - Issue tracker</strong>})}</span>}
                                                placeholder={this.i18n('Short description of usage')}/>
                                            <Switch label={this.i18n('Enabled')} name="enabled"/>
                                            <Switch label={this.i18n('Log requests')} name="logRequests"/>
                                        </Grid.Col>
                                    </Grid.Row>
                                    <br/>
                                    <Grid.Row>
                                        <Grid.Col all={12}>
                                            <Tabs>
                                                <Tabs.Tab label={this.i18n('Roles')} icon="fa-user">
                                                    <UserRoles name="roles"/>
                                                </Tabs.Tab>
                                                <Tabs.Tab label={this.i18n('Role Groups')} icon="fa-users">
                                                    <UserRoleGroups name="roleGroups"/>
                                                </Tabs.Tab>
                                            </Tabs>
                                        </Grid.Col>
                                    </Grid.Row>
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button label={this.i18n('Cancel')} onClick={this.hide}/>
                                    <Button type="primary" label={this.i18n('Save token')} onClick={form.submit}/>
                                </Modal.Footer>
                            </Modal.Content>
                        )}
                    </Form>
                )}
            </Modal.Dialog>
        );
    }
}

export default Webiny.createComponent(ApiTokenModal, {
    modules: ['Modal', 'Form', 'Grid', 'Input', 'Switch', 'Button', 'Tabs', {
        UserRoles: 'Webiny/Backend/UserRoles',
        UserRoleGroups: 'Webiny/Backend/UserRoleGroups'
    }]
});