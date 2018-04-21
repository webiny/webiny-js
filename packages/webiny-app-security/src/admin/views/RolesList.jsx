import React, { Fragment } from "react";

// import ExportModal from "./Modal/ExportModal";
// import ImportModal from "./Modal/ImportModal";

import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.RolesList");

class RolesList extends React.Component {
    render() {
        const {
            View,
            List,
            ListData,
            Link,
            Icon,
            Input,
            AdminLayout,
            ButtonGroup,
            Button,
            Grid,
            ViewSwitcher,
            Loader
        } = this.props.modules;

        const Table = List.Table;

        const users = <Link route="Users.List">{t`Users`}</Link>;
        const permissions = <Link route="Permissions.List">{t`Permissions`}</Link>;

        return (
            <AdminLayout>
                <ViewSwitcher>
                    <ViewSwitcher.View name="listView" defaultView>
                        {({ showView }) => (
                            <View.List>
                                <View.Header
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
                                    <ButtonGroup>
                                        <Link type="primary" route="Roles.Create">
                                            <Icon icon="plus-circle" />
                                            {t`Create`}
                                        </Link>
                                        <Button
                                            type="secondary"
                                            onClick={showView("importModal")}
                                            icon="upload"
                                            label={t`Import`}
                                        />
                                    </ButtonGroup>
                                </View.Header>
                                <View.Body>
                                    <ListData
                                        withRouter
                                        entity="SecurityRole"
                                        fields="id name slug description createdOn"
                                        search={{ fields: ["name", "slug", "description"] }}
                                    >
                                        {({ loading, ...listProps }) => (
                                            <Fragment>
                                                {loading && <Loader />}

                                                <List {...listProps}>
                                                    <List.FormFilters>
                                                        {({ apply }) => (
                                                            <Grid.Row>
                                                                <Grid.Col all={12}>
                                                                    <Input
                                                                        name="search.query"
                                                                        placeholder={t`Search by name, description or slug`}
                                                                        onEnter={apply()}
                                                                    />
                                                                </Grid.Col>
                                                            </Grid.Row>
                                                        )}
                                                    </List.FormFilters>
                                                    <Table>
                                                        <Table.Row>
                                                            <Table.Field
                                                                name="name"
                                                                label={t`Name`}
                                                                sort="name"
                                                            >
                                                                {({ data }) => (
                                                                    <span>
                                                                        <Link
                                                                            route="Roles.Edit"
                                                                            params={{ id: data.id }}
                                                                        >
                                                                            <strong>
                                                                                {data.name}
                                                                            </strong>
                                                                        </Link>
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
                                                            <Table.DateField
                                                                name="createdOn"
                                                                label={t`Created On`}
                                                                sort="createdOn"
                                                            />
                                                            <Table.Actions>
                                                                <Table.EditAction route="Roles.Edit" />
                                                                <Table.Action
                                                                    label={t`Export`}
                                                                    icon="download"
                                                                    onClick={showView(
                                                                        "exportModal"
                                                                    )}
                                                                />
                                                                <Table.DeleteAction />
                                                            </Table.Actions>
                                                        </Table.Row>
                                                    </Table>
                                                    <List.Pagination />
                                                </List>
                                            </Fragment>
                                        )}
                                    </ListData>
                                </View.Body>
                            </View.List>
                        )}
                    </ViewSwitcher.View>
                    {/*  <ViewSwitcher.View name="exportModal" modal>
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
                    </ViewSwitcher.View>

                    <ViewSwitcher.View view="importModal" modal>
                        {() => (
                            <ImportModal
                                name="importModal"
                                api="/entities/webiny/user-roles"
                                label={t`Role`}
                                onImported={() => this.list.loadData()}
                            />
                        )}
                    </ViewSwitcher.View>*/}
                </ViewSwitcher>
            </AdminLayout>
        );
    }
}

export default createComponent(RolesList, {
    modules: [
        { AdminLayout: "Admin.Layout" },
        "ViewSwitcher",
        "View",
        "Link",
        "Icon",
        "Grid",
        "Input",
        "List",
        "ListData",
        "Button",
        "Loader",
        "ButtonGroup"
    ]
});
