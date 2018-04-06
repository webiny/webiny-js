import React from "react";

// import ExportModal from "./Modal/ExportModal";
// import ImportModal from "./Modal/ImportModal";

import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.RolesList");

class RolesList extends React.Component {
    render() {
        const listProps = {
            ref: ref => (this.list = ref),
            api: "/security/roles",
            fields: "id,name,slug,description,createdOn",
            connectToRouter: true,
            query: { _sort: "name" },
            searchFields: "name,slug,description",
            perPage: 25
        };

        const { Ui } = this.props;
        const Table = Ui.List.Table;

        const users = <Ui.Link route="Users.List">{t`Users`}</Ui.Link>;
        const permissions = <Ui.Link route="Permissions.List">{t`Permissions`}</Ui.Link>;

        return (
            <Ui.AdminLayout>
                <Ui.ViewSwitcher>
                    <Ui.ViewSwitcher.View view="listView" defaultView>
                        {({ showView }) => (
                            <Ui.View.List>
                                <Ui.View.Header
                                    title={t`Security - Roles`}
                                    description={
                                        <span>
                                            {t`Roles are a simple way to control what permissions certain users have.
                                                    Create a role with a set of {permissions} and then assign roles to
                                                    {users}.`({
                                                permissions,
                                                users
                                            })}
                                        </span>
                                    }
                                >
                                    <Ui.ButtonGroup>
                                        <Ui.Link type="primary" route="Roles.Create">
                                            <Ui.Icon icon="icon-plus-circled" />
                                            {t`Create`}
                                        </Ui.Link>
                                        <Ui.Button
                                            type="secondary"
                                            onClick={showView("importModal")}
                                            icon="fa-upload"
                                            label={t`Import`}
                                        />
                                    </Ui.ButtonGroup>
                                </Ui.View.Header>
                                <Ui.View.Body>
                                    <Ui.List {...listProps}>
                                        <Ui.List.FormFilters>
                                            {({ apply }) => (
                                                <Ui.Grid.Row>
                                                    <Ui.Grid.Col all={12}>
                                                        <Ui.Input
                                                            name="_searchQuery"
                                                            placeholder={t`Search by name, description or slug`}
                                                            onEnter={apply()}
                                                        />
                                                    </Ui.Grid.Col>
                                                </Ui.Grid.Row>
                                            )}
                                        </Ui.List.FormFilters>
                                        <Table>
                                            <Table.Row>
                                                <Table.Field
                                                    name="name"
                                                    label={t`Name`}
                                                    sort="name"
                                                >
                                                    {({ data }) => (
                                                        <span>
                                                            <Ui.Link
                                                                route="Roles.Edit"
                                                                params={{ id: data.id }}
                                                            >
                                                                <strong>{data.name}</strong>
                                                            </Ui.Link>
                                                            <br />
                                                            {data.description}
                                                        </span>
                                                    )}
                                                </Table.Field>
                                                <Table.Field
                                                    name="slug"
                                                    label={t`Slug`}
                                                    sort="slug"
                                                />
                                                <Table.Actions>
                                                    <Table.EditAction route="Roles.Edit" />
                                                    <Table.Action
                                                        label={t`Export`}
                                                        icon="fa-download"
                                                        onClick={showView("exportModal")}
                                                    />
                                                    <Table.DeleteAction />
                                                </Table.Actions>
                                            </Table.Row>
                                        </Table>
                                        <Ui.List.Pagination />
                                    </Ui.List>
                                </Ui.View.Body>
                            </Ui.View.List>
                        )}
                    </Ui.ViewSwitcher.View>
                    {/*  <Ui.ViewSwitcher.View view="exportModal" modal>
                        {({ data: { data } }) => (
                            <ExportModal
                                name="exportModal"
                                data={data}
                                map="permissions"
                                api="/entities/webiny/user-roles"
                                fields="name,slug,description,permissions.slug"
                                label={t`Role`}
                            />
                        )}
                    </Ui.ViewSwitcher.View>

                    <Ui.ViewSwitcher.View view="importModal" modal>
                        {() => (
                            <ImportModal
                                name="importModal"
                                api="/entities/webiny/user-roles"
                                label={t`Role`}
                                onImported={() => this.list.loadData()}
                            />
                        )}
                    </Ui.ViewSwitcher.View>*/}
                </Ui.ViewSwitcher>
            </Ui.AdminLayout>
        );
    }
}

export default createComponent(RolesList, {
    modulesProp: "Ui",
    modules: [
        { AdminLayout: "Skeleton.AdminLayout" },
        "ViewSwitcher",
        "View",
        "Link",
        "Icon",
        "Grid",
        "Input",
        "List",
        "Button",
        "ButtonGroup"
    ]
});
