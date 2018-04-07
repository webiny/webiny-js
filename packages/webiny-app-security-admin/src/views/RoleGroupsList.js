import React from "react";

// import ExportModal from "./Modal/ExportModal";
// import ImportModal from "./Modal/ImportModal";
import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.RoleGroupsList");

class RoleGroupsList extends React.Component {
    render() {
        const listProps = {
            ref: ref => (this.list = ref),
            api: "/security/role-groups",
            fields: "id,name,slug,description,createdOn",
            connectToRouter: true,
            query: { _sort: "name" },
            searchFields: "name,slug,description",
            perPage: 25
        };

        const { Ui } = this.props;
        const Table = Ui.List.Table;

        const users = <Ui.Link route="Users.List">{t`Users`}</Ui.Link>;
        const roles = <Ui.Link route="Roles.List">{t`Roles`}</Ui.Link>;
        return (
            <Ui.AdminLayout>
                <Ui.ViewSwitcher>
                    <Ui.ViewSwitcher.View view="listView" defaultView>
                        {({ showView }) => (
                            <Ui.View.List>
                                <Ui.View.Header
                                    title={t`Security - Role Groups`}
                                    description={
                                        <span>
                                            {t`Role Groups are a simple way to control what set of roles certain users have.
                                                    Create a role group with a set of {roles} and then assign role groups to {users}.`(
                                                { roles, users }
                                            )}
                                        </span>
                                    }
                                >
                                    <Ui.ButtonGroup>
                                        <Ui.Link type="primary" route="RoleGroups.Create">
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
                                                                route="RoleGroups.Edit"
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
                                                    <Table.EditAction route="RoleGroups.Edit" />
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

                    {/* <Ui.ViewSwitcher.View view="exportModal" modal>
                        {({ data: { data } }) => (
                            <ExportModal
                                data={data}
                                map="roles"
                                api="/security/role-groups"
                                fields="name,slug,description,roles"
                                label={t`Role Group`}
                            />
                        )}
                    </Ui.ViewSwitcher.View>

                    <Ui.ViewSwitcher.View view="importModal" modal>
                        {() => (
                            <ImportModal
                                api="/security/role-groups"
                                label={t`Role Group`}
                                onImported={() => this.list.loadData()}
                            />
                        )}
                    </Ui.ViewSwitcher.View>*/}
                </Ui.ViewSwitcher>
            </Ui.AdminLayout>
        );
    }
}

export default createComponent(RoleGroupsList, {
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
