import React from 'react';
import {Webiny} from 'webiny-client';
import ExportPermissionModal from './Modal/ExportModal';
import ImportPermissionModal from './Modal/ImportModal';

/**
 * @i18n.namespace Webiny.Backend.Acl.UserPermissionsList
 */
class UserPermissionsList extends Webiny.Ui.View {

}

UserPermissionsList.defaultProps = {
    renderer() {
        const {Ui} = this.props;
        const Table = Ui.List.Table;

        const listProps = {
            ref: ref => this.list = ref,
            api: '/entities/webiny/user-permissions',
            fields: 'id,name,slug,createdOn,description',
            connectToRouter: true,
            query: {_sort: 'name'},
            searchFields: 'name,slug',
            perPage: 25
        };

        const rolesLink = <Ui.Link route="UserRoles.List">{this.i18n('Roles')}</Ui.Link>;

        return (
            <Ui.ViewSwitcher>
                <Ui.ViewSwitcher.View view="permissionsList" defaultView>
                    {({showView}) => (
                        <Ui.View.List>
                            <Ui.View.Header
                                title={this.i18n('ACL - Permissions')}
                                description={
                                    <span>
                                        {this.i18n(`Permissions define what a user is allowed to do with entities and services.
                                                    Define permissions and then group them into {rolesLink}.`, {rolesLink})}
                                    </span>
                                }>
                                <Ui.ButtonGroup>
                                    <Ui.Link type="primary" route="UserPermissions.Create">
                                        <Ui.Icon icon="icon-plus-circled"/>
                                        {this.i18n('Create')}
                                    </Ui.Link>
                                    <Ui.Button
                                        type="secondary"
                                        onClick={showView('importModal')}
                                        icon="fa-upload"
                                        label={this.i18n('Import')}/>
                                </Ui.ButtonGroup>
                            </Ui.View.Header>
                            <Ui.View.Body>
                                <Ui.List {...listProps}>
                                    <Ui.List.FormFilters>
                                        {({apply}) => (
                                            <Ui.Grid.Row>
                                                <Ui.Grid.Col all={12}>
                                                    <Ui.Input
                                                        name="_searchQuery"
                                                        placeholder={this.i18n('Search by name or slug')}
                                                        onEnter={apply()}/>
                                                </Ui.Grid.Col>
                                            </Ui.Grid.Row>
                                        )}
                                    </Ui.List.FormFilters>
                                    <Table>
                                        <Table.Row>
                                            <Table.Field name="name" label={this.i18n('Name')} sort="name">
                                                {({data}) => (
                                                    <span>
                                                        <Ui.Link route="UserPermissions.Edit" params={{id: data.id}}>
                                                            <strong>{data.name}</strong>
                                                        </Ui.Link>
                                                        <br/>
                                                        {data.description}
                                                    </span>
                                                )}
                                            </Table.Field>
                                            <Table.Field name="slug" label={this.i18n('Slug')} sort="slug"/>
                                            <Table.Actions>
                                                <Table.EditAction route="UserPermissions.Edit"/>
                                                <Table.Action
                                                    label={this.i18n('Export')}
                                                    icon="fa-download"
                                                    onClick={showView('exportModal')}/>
                                                <Table.DeleteAction/>
                                            </Table.Actions>
                                        </Table.Row>
                                    </Table>
                                    <Ui.List.Pagination/>
                                </Ui.List>
                            </Ui.View.Body>
                        </Ui.View.List>
                    )}
                </Ui.ViewSwitcher.View>

                <Ui.ViewSwitcher.View view="exportModal" modal>
                    {({data: {data}}) => (
                        <ExportPermissionModal
                            data={data}
                            api="/entities/webiny/user-permissions"
                            fields="name,slug,description,permissions"
                            label={this.i18n('Permission')}/>
                    )}
                </Ui.ViewSwitcher.View>

                <Ui.ViewSwitcher.View view="importModal" modal>
                    {() => (
                        <ImportPermissionModal
                            api="/entities/webiny/user-permissions"
                            label={this.i18n('Permission')}
                            onImported={() => this.list.loadData()}/>
                    )}
                </Ui.ViewSwitcher.View>
            </Ui.ViewSwitcher>
        );
    }
};

export default Webiny.createComponent(UserPermissionsList, {
    modulesProp: 'Ui',
    modules: ['ViewSwitcher', 'Link', 'View', 'List', 'Icon', 'Grid', 'Input', 'Button', 'ButtonGroup']
});