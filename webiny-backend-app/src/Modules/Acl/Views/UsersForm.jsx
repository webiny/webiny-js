import React from 'react';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Backend.Acl.UsersForm
 */
class UsersForm extends Webiny.Ui.View {
}

UsersForm.defaultProps = {
    renderer() {
        const formProps = {
            api: Webiny.Auth.getApiEndpoint(),
            fields: 'id,firstName,lastName,email,roles,roleGroups,enabled',
            connectToRouter: true,
            onSubmitSuccess: () => {
                Webiny.Auth.refresh();
                Webiny.Router.goToRoute('Users.List');
            },
            onCancel: 'Users.List',
            onSuccessMessage: ({model}) => {
                return <span>{this.i18n('User {user} was saved successfully!', {user: <strong>{model.firstName}</strong>})}</span>;
            }
        };

        const {Ui} = this.props;

        return (
            <Ui.Form {...formProps}>
                {({model, form}) => (
                    <Ui.View.Form>
                        <Ui.View.Header title={model.id ? this.i18n('ACL - Edit User') : this.i18n('ACL - Create User')}/>
                        <Ui.Form.Error message={this.i18n('Something went wrong during save')}/>
                        <Ui.View.Body>
                            <Ui.Grid.Row>
                                <Ui.Grid.Col all={6}>
                                    <Ui.Section title={this.i18n('Info')}/>
                                    <Ui.Grid.Row>
                                        <Ui.Grid.Col all={12}>
                                            <Ui.Input label={this.i18n('First name')} name="firstName" validate="required"/>
                                            <Ui.Input label={this.i18n('Last name')} name="lastName" validate="required"/>
                                            <Ui.Input
                                                label={this.i18n('Email')}
                                                name="email"
                                                description={this.i18n('Your email')}
                                                validate="required,email"/>
                                        </Ui.Grid.Col>
                                    </Ui.Grid.Row>
                                </Ui.Grid.Col>
                                <Ui.Grid.Col all={6}>
                                    <Ui.Section title={this.i18n('Password')}/>
                                    <Ui.Grid.Row>
                                        <Ui.Grid.Col all={12}>
                                            <Ui.Password
                                                label={this.i18n('New password')}
                                                name="password"
                                                placeholder={this.i18n('Type a new password')}/>
                                            <Ui.Password
                                                label={this.i18n('Confirm password')}
                                                name="confirmPassword"
                                                validate="eq:@password"
                                                placeholder={this.i18n('Retype the new password')}>
                                                <validator name="eq">{this.i18n('Passwords do not match')}</validator>
                                            </Ui.Password>
                                        </Ui.Grid.Col>
                                    </Ui.Grid.Row>
                                </Ui.Grid.Col>
                            </Ui.Grid.Row>
                            <Ui.Grid.Row>
                                <Ui.Grid.Col all={12}>
                                    <Ui.Switch label={this.i18n('Enabled')} name="enabled"/>
                                </Ui.Grid.Col>
                            </Ui.Grid.Row>
                            <Ui.Grid.Row>
                                <Ui.Grid.Col all={12}>
                                    <Ui.Tabs>
                                        <Ui.Tabs.Tab label={this.i18n('Roles')} icon="fa-user">
                                            <Ui.UserRoles name="roles"/>
                                        </Ui.Tabs.Tab>
                                        <Ui.Tabs.Tab label={this.i18n('Role Groups')} icon="fa-users">
                                            <Ui.UserRoleGroups name="roleGroups"/>
                                        </Ui.Tabs.Tab>
                                    </Ui.Tabs>
                                </Ui.Grid.Col>
                            </Ui.Grid.Row>
                        </Ui.View.Body>
                        <Ui.View.Footer>
                            <Ui.Button type="default" onClick={form.cancel} label={this.i18n('Go back')}/>
                            <Ui.Button type="primary" onClick={form.submit} label={this.i18n('Save user')} align="right"/>
                        </Ui.View.Footer>
                    </Ui.View.Form>
                )}
            </Ui.Form>
        );
    }
};

export default Webiny.createComponent(UsersForm, {
    modulesProp: 'Ui',
    modules: ['View', 'Form', 'Grid', 'Tabs', 'Input', 'Password', 'Switch', 'Button', 'Section', {
        UserRoles: 'Webiny/Backend/UserRoles',
        UserRoleGroups: 'Webiny/Backend/UserRoleGroups'
    }]
});
