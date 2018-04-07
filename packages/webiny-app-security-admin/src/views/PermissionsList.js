import React from "react";

// import ExportPermissionModal from "./Modal/ExportModal";
// import ImportPermissionModal from "./Modal/ImportModal";
import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.PermissionsList");

class PermissionsList extends React.Component {
    render() {
        const { Ui } = this.props;
        const Table = Ui.List.Table;

        const listProps = {
            ref: ref => (this.list = ref),
            api: "/security/permissions",
            fields: "id,name,slug,createdOn,description",
            connectToRouter: true,
            query: { _sort: "name" },
            searchFields: "name,slug",
            perPage: 25
        };

        const rolesLink = <Ui.Link route="Roles.List">{t`Roles`}</Ui.Link>;

        return (
            <Ui.AdminLayout>
                <Ui.ViewSwitcher>
                    <Ui.ViewSwitcher.View view="permissionsList" defaultView>
                        {({ showView }) => (
                            <Ui.View.List>
                                <Ui.View.Header
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
                                    <Ui.ButtonGroup>
                                        <Ui.Link type="primary" route="Permissions.Create">
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
                                                            placeholder={t`Search by name or slug`}
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
                                                                route="Permissions.Edit"
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
                                                    <Table.EditAction route="Permissions.Edit" />
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

                    {/*         <Ui.ViewSwitcher.View view="exportModal" modal>
                        {({ data: { data } }) => (
                            <ExportPermissionModal
                                data={data}
                                api="/security/permissions"
                                fields="name,slug,description,permissions"
                                label={t`Permission`}
                            />
                        )}
                    </Ui.ViewSwitcher.View>

                    <Ui.ViewSwitcher.View view="importModal" modal>
                        {() => (
                            <ImportPermissionModal
                                api="/security/permissions"
                                label={t`Permission`}
                                onImported={() => this.list.loadData()}
                            />
                        )}
                    </Ui.ViewSwitcher.View>*/}
                </Ui.ViewSwitcher>
            </Ui.AdminLayout>
        );
    }
}

export default createComponent(PermissionsList, {
    modulesProp: "Ui",
    modules: [
        { AdminLayout: "Skeleton.AdminLayout" },
        "ViewSwitcher",
        "Link",
        "View",
        "List",
        "Icon",
        "Grid",
        "Input",
        "Button",
        "ButtonGroup"
    ]
});
