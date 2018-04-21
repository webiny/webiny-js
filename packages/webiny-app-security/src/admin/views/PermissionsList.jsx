import React, { Fragment } from "react";

// import ExportPermissionModal from "./Modal/ExportModal";
// import ImportPermissionModal from "./Modal/ImportModal";
import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.PermissionsList");

class PermissionsList extends React.Component {
    render() {
        const {
            Link,
            ViewSwitcher,
            View,
            List,
            ListData,
            Button,
            ButtonGroup,
            AdminLayout,
            Grid,
            Icon,
            Input,
            Loader
        } = this.props.modules;
        const Table = List.Table;

        const rolesLink = <Link route="Roles.List">{t`Roles`}</Link>;

        return (
            <AdminLayout>
                <ViewSwitcher>
                    <ViewSwitcher.View name="permissionsList" defaultView>
                        {({ showView }) => (
                            <View.List>
                                <View.Header
                                    title={t`Security - Permissions`}
                                    description={
                                        <span>
                                            {t`Permissions define what a user is allowed to do with API endpoints.
                                                    Define permissions and then group them into {rolesLink}.`(
                                                { rolesLink }
                                            )}
                                        </span>
                                    }
                                >
                                    <ButtonGroup>
                                        <Link type="primary" route="Permissions.Create">
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
                                        entity="SecurityPermission"
                                        fields="id name slug description createdOn"
                                        search={{ fields: ["name", "slug"] }}
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
                                                                        placeholder={t`Search by name or slug`}
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
                                                                            route="Permissions.Edit"
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
                                                                <Table.EditAction route="Permissions.Edit" />
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

                    {/*         <ViewSwitcher.View name="exportModal" modal>
                        {({ data: { data } }) => (
                            <ExportPermissionModal
                                data={data}
                                api="/security/permissions"
                                fields="name,slug,description,permissions"
                                label={t`Permission`}
                            />
                        )}
                    </ViewSwitcher.View>

                    <ViewSwitcher.View name="importModal" modal>
                        {() => (
                            <ImportPermissionModal
                                api="/security/permissions"
                                label={t`Permission`}
                                onImported={() => this.list.loadData()}
                            />
                        )}
                    </ViewSwitcher.View>*/}
                </ViewSwitcher>
            </AdminLayout>
        );
    }
}

export default createComponent(PermissionsList, {
    modules: [
        { AdminLayout: "Admin.Layout" },
        "ViewSwitcher",
        "Link",
        "View",
        "List",
        "ListData",
        "Icon",
        "Grid",
        "Input",
        "Button",
        "Loader",
        "ButtonGroup"
    ]
});
