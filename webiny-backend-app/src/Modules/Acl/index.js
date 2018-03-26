import {Webiny} from 'webiny-client';
import React from 'react';
import Views from './Views/Views';

/**
 * @i18n.namespace Webiny.Backend.Acl
 */
class Module extends Webiny.App.Module {

    init() {
        this.name = 'Acl';
        const Menu = Webiny.Ui.Menu;

        const aclManageUsers = 'webiny-acl-user-manager';
        const aclApiTokens = 'webiny-acl-api-token-manager';

        this.registerMenus(
            <Menu label={Webiny.I18n('ACL')} icon="icon-users">
                <Menu label={Webiny.I18n('User Management')} role={aclManageUsers}>
                    <Menu label={Webiny.I18n('Permissions')} route="UserPermissions.List" order={1}/>
                    <Menu label={Webiny.I18n('Roles')} route="UserRoles.List" order={2}/>
                    <Menu label={Webiny.I18n('Role Groups')} route="UserRoleGroups.List" order={3}/>
                    <Menu label={Webiny.I18n('Users')} route="Users.List" order={4}/>
                </Menu>
                <Menu label={Webiny.I18n('API')} role={aclApiTokens}>
                    <Menu label={Webiny.I18n('Request Logs')} route="ApiLogs.List"/>
                    <Menu label={Webiny.I18n('Tokens')} route="ApiTokens.List"/>
                </Menu>
            </Menu>
        );

        this.registerRoutes(
            new Webiny.Route('Users.Create', '/acl/users/new', Views.UsersForm, 'ACL - Create User').setRole(aclManageUsers),
            new Webiny.Route('Users.Edit', '/acl/users/:id', Views.UsersForm, 'ACL - Edit User').setRole(aclManageUsers),
            new Webiny.Route('Users.List', '/acl/users', Views.UsersList, 'ACL - Users').setRole(aclManageUsers),
            new Webiny.Route('UserRoles.Create', '/acl/roles/new', Views.UserRolesForm, 'ACL - Create Role').setRole(aclManageUsers),
            new Webiny.Route('UserRoles.Edit', '/acl/roles/:id', Views.UserRolesForm, 'ACL - Edit Role').setRole(aclManageUsers),
            new Webiny.Route('UserRoles.List', '/acl/roles', Views.UserRolesList, 'ACL - Roles').setRole(aclManageUsers),
            new Webiny.Route('UserRoleGroups.Create', '/acl/role-groups/new', Views.UserRoleGroupsForm, 'ACL - Create Role Group').setRole(aclManageUsers),
            new Webiny.Route('UserRoleGroups.Edit', '/acl/role-groups/:id', Views.UserRoleGroupsForm, 'ACL - Edit Role Group').setRole(aclManageUsers),
            new Webiny.Route('UserRoleGroups.List', '/acl/role-groups', Views.UserRoleGroupsList, 'ACL - Role Groups').setRole(aclManageUsers),
            new Webiny.Route('UserPermissions.Create', '/acl/permissions/new', Views.UserPermissionsForm, 'ACL - Create Permission').setRole(aclManageUsers),
            new Webiny.Route('UserPermissions.Edit', '/acl/permissions/:id', Views.UserPermissionsForm, 'ACL - Edit Permission').setRole(aclManageUsers),
            new Webiny.Route('UserPermissions.List', '/acl/permissions', Views.UserPermissionsList, 'ACL - Permissions').setRole(aclManageUsers),
            new Webiny.Route('ApiTokens.List', '/acl/api-tokens', Views.ApiTokensList, 'ACL - API Tokens').setRole(aclApiTokens),
            new Webiny.Route('ApiLogs.List', '/acl/api-logs', Views.ApiLogsList, 'ACL - API Logs').setRole(aclApiTokens)
        );
    }
}

export default Module;