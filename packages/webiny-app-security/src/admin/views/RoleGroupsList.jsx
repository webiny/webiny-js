import React, { Fragment } from "react";
import { GraphQLListData } from "webiny-data-ui";

// import ExportModal from "./Modal/ExportModal";
// import ImportModal from "./Modal/ImportModal";
import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.RoleGroupsList");

class RoleGroupsList extends React.Component {
    render() {
        const {
            Link,
            ViewSwitcher,
            View,
            List,
            Button,
            ButtonGroup,
            AdminLayout,
            Grid,
            Icon,
            Input,
            Loader
        } = this.props.modules;
        const Table = List.Table;

        const users = <Link route="Users.List">{t`Users`}</Link>;
        const roles = <Link route="Roles.List">{t`Roles`}</Link>;
        return (
            <AdminLayout>
                <ViewSwitcher>
                    <ViewSwitcher.View name="listView" defaultView>
                        {({ showView }) => (
                            <View.List>
                                <View.Header
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
                                    <ButtonGroup>
                                        <Link type="primary" route="RoleGroups.Create">
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
                                    <GraphQLListData
                                        withRouter
                                        entity="SecurityRoleGroup"
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
                                                                            route="RoleGroups.Edit"
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
                                                            <Table.Actions>
                                                                <Table.EditAction route="RoleGroups.Edit" />
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
                                    </GraphQLListData>
                                </View.Body>
                            </View.List>
                        )}
                    </ViewSwitcher.View>

                    {/* <Ui.ViewSwitcher.View name="exportModal" modal>
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

                    <Ui.ViewSwitcher.View name="importModal" modal>
                        {() => (
                            <ImportModal
                                api="/security/role-groups"
                                label={t`Role Group`}
                                onImported={() => this.list.loadData()}
                            />
                        )}
                    </Ui.ViewSwitcher.View>*/}
                </ViewSwitcher>
            </AdminLayout>
        );
    }
}

export default createComponent(RoleGroupsList, {
    modules: [
        { AdminLayout: "Admin.Layout" },
        "ViewSwitcher",
        "View",
        "Link",
        "Icon",
        "Grid",
        "Input",
        "List",
        "Button",
        "Loader",
        "ButtonGroup"
    ]
});
