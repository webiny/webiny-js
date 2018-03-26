import React from 'react';
import {Webiny} from 'webiny-client';
import _ from 'lodash';

/**
 * @i18n.namespace Webiny.Backend.Acl.UsersList
 */
class UsersList extends Webiny.Ui.View {
    constructor() {
        super();
        this.bindMethods('renderFullNameField');
    }

    renderFullNameField(row) {
        let fullName = _.trim(`${row.data.firstName} ${row.data.lastName}`);
        fullName = _.isEmpty(fullName) ? row.data.email : fullName;
        return (
            <span>
                <strong>{fullName}</strong><br/>{row.data.id}
            </span>
        );
    }
}

UsersList.defaultProps = {
    renderer() {
        const listProps = {
            api: '/entities/webiny/users',
            fields: 'id,enabled,firstName,lastName,email,createdOn,gravatar',
            connectToRouter: true,
            searchFields: 'firstName,lastName,email'
        };

        const {View, List, Link, Icon, Input} = this.props;
        const Table = List.Table;

        const roles = <Link route="UserRoles.List">{this.i18n('Roles')}</Link>;
        const permissions = <Link route="UserPermissions.List">{this.i18n('Permissions')}</Link>;

        return (
            <View.List>
                <View.Header
                    title={this.i18n('ACL - Users')}
                    description={
                        <span>
                            {this.i18n(`Once your system {permissions} and {roles} are defined,
                                        you can create your system users here.`, {permissions, roles})}
                        </span>}>
                    <Link type="primary" route="Users.Create" align="right">
                        <Icon icon="icon-plus-circled"/>
                        {this.i18n('Create user')}
                    </Link>
                </View.Header>
                <View.Body>
                    <List {...listProps}>
                        <List.FormFilters>
                            {({apply}) => (
                                <Input
                                    name="_searchQuery"
                                    placeholder={this.i18n('Search by name or email')}
                                    onEnter={apply()}/>
                            )}
                        </List.FormFilters>
                        <Table>
                            <Table.Row>
                                <Table.GravatarField name="gravatar"/>
                                <Table.Field name="firstName" label={this.i18n('First Name')} sort="firstName" route="Users.Edit">
                                    {this.renderFullNameField}
                                </Table.Field>
                                <Table.Field name="email" sort="email" label={this.i18n('Email')}/>
                                <Table.ToggleField
                                    name="enabled"
                                    label={this.i18n('Status')}
                                    sort="enabled"
                                    align="center"
                                    message={({value}) => {
                                        if (!value) {
                                            return this.i18n('This will disable user\'s account and prevent him from logging in!')
                                        }
                                        return null;
                                    }}/>
                                <Table.DateField name="createdOn" label={this.i18n('Created On')} sort="createdOn"/>
                                <Table.Actions>
                                    <Table.EditAction route="Users.Edit"/>
                                    <Table.DeleteAction/>
                                </Table.Actions>
                            </Table.Row>
                            <Table.Footer/>
                        </Table>
                        <List.Pagination/>
                    </List>
                </View.Body>
            </View.List>
        );
    }
};

export default Webiny.createComponent(UsersList, {
    modules: ['View', 'List', 'Link', 'Icon', 'Input']
});