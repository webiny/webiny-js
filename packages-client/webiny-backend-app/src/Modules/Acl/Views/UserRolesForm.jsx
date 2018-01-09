import React from 'react';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Backend.Acl.UserRolesForm
 */
class UserRolesForm extends Webiny.Ui.View {

}

UserRolesForm.defaultProps = {
    renderer() {
        const formProps = {
            api: '/entities/webiny/user-roles',
            fields: '*,permissions,isAdminRole',
            connectToRouter: true,
            onSubmitSuccess: 'UserRoles.List',
            onCancel: 'UserRoles.List',
            onSuccessMessage: ({model}) => {
                return <span>{this.i18n('Role {role} was saved successfully!', {role: <strong>{model.name}</strong>})}</span>;
            }
        };

        const {Ui} = this.props;

        return (
            <Ui.Form {...formProps}>
                {({model, form}) => (
                    <Ui.View.Form>
                        <Ui.View.Header title={model.id ? this.i18n('ACL - Edit Role') : this.i18n('ACL - Create Role')}/>
                        <Ui.View.Body>
                            <Ui.Section title={this.i18n('General')}/>
                            <Ui.Grid.Row>
                                <Ui.Grid.Col all={6}>
                                    <Ui.Input label={this.i18n('Name')} name="name" validate="required"/>
                                </Ui.Grid.Col>
                                <Ui.Grid.Col all={6}>
                                    <Ui.Input label={this.i18n('Slug')} name="slug" validate="required"/>
                                </Ui.Grid.Col>
                            </Ui.Grid.Row>
                            <Ui.Grid.Row>
                                <Ui.Grid.Col all={12}>
                                    <Ui.Input label={this.i18n('Description')} name="description" validate="required"/>
                                </Ui.Grid.Col>
                                <Ui.Grid.Col all={12}>
                                    <Ui.Switch label={this.i18n('Is admin role?')} name="isAdminRole"
                                               description={this.i18n('If enabled, this role will be assigned to the admin user who is installing the corresponding app')}/>
                                </Ui.Grid.Col>
                            </Ui.Grid.Row>
                            <Ui.UserPermissions name="permissions"/>
                        </Ui.View.Body>
                        <Ui.View.Footer>
                            <Ui.Button type="default" onClick={form.cancel} label={this.i18n('Go back')}/>
                            <Ui.Button type="primary" onClick={form.submit} label={this.i18n('Save role')} align="right"/>
                        </Ui.View.Footer>
                    </Ui.View.Form>
                )}
            </Ui.Form>
        );
    }
};

export default Webiny.createComponent(UserRolesForm, {
    modulesProp: 'Ui',
    modules: [
        'Switch', 'Form', 'View', 'Tabs', 'Input', 'Button', 'Grid', 'Section',
        {UserPermissions: 'Webiny/Backend/UserPermissions'}
    ]
});
