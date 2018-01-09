import React from 'react';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Backend.Acl.UserRoleGroupsForm
 */
class UserRoleGroupsForm extends Webiny.Ui.View {

}

UserRoleGroupsForm.defaultProps = {
    renderer() {
        const formProps = {
            api: '/entities/webiny/user-role-groups',
            fields: '*,roles',
            connectToRouter: true,
            onSubmitSuccess: 'UserRoleGroups.List',
            onCancel: 'UserRoleGroups.List',
            onSuccessMessage: ({model}) => {
                return <span>{this.i18n('Role group {group} was saved successfully!', {group: <strong>{model.name}</strong>})}</span>;
            }
        };

        const {Ui} = this.props;

        return (
            <Ui.Form {...formProps}>
                {({model, form}) => (
                    <Ui.View.Form>
                        <Ui.View.Header title={model.id ? this.i18n('ACL - Edit Role Group') : this.i18n('ACL - Create Role Group')}/>
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
                            </Ui.Grid.Row>
                            <Ui.UserRoles name="roles"/>
                        </Ui.View.Body>
                        <Ui.View.Footer>
                            <Ui.Button type="default" onClick={form.cancel} label={this.i18n('Go back')}/>
                            <Ui.Button type="primary" onClick={form.submit} label={this.i18n('Save role group')} align="right"/>
                        </Ui.View.Footer>
                    </Ui.View.Form>
                )}
            </Ui.Form>
        );
    }
};

export default Webiny.createComponent(UserRoleGroupsForm, {
    modulesProp: 'Ui',
    modules: [
        'Switch', 'Form', 'View', 'Tabs', 'Input', 'Button', 'Grid', 'Section',
        {UserRoles: 'Webiny/Backend/UserRoles'}
    ]
});
