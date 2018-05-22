import React, { Fragment } from "react";
import TogglePermissionButton from "./components/TogglePermissionButton";
import _ from "lodash";
import gql from "graphql-tag";
// import ExportEntityModal from "./Modal/ExportModal";
// import ImportEntityModal from "./Modal/ImportModal";
import { app, i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.EntitiesList");

class EntitiesList extends React.Component {
    async toggleOperation(classId, operation, permissionsClass) {
        const mutation = gql`
            mutation {
                toggleEntityOperationPermission(
                    classId: "${classId}"
                    class: "${permissionsClass}"
                    operation: "${operation}"
                ) {
                   entity { classId } permissions { owner group other }
                }
            }
        `;

        await app.graphql.mutate({ mutation });
    }

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

        return (
            <AdminLayout>
                <ViewSwitcher>
                    <ViewSwitcher.View name="entitiesList" defaultView>
                        {({ showView }) => (
                            <View.List>
                                <View.Header
                                    title={t`Security - Entities`}
                                    description={
                                        <span>{t`Manage entities and its permissions`}</span>
                                    }
                                >
                                   {/* <ButtonGroup>
                                        <Link type="primary" route="Entities.Create">
                                            <Icon icon="upload" />
                                            {t`Export`}
                                        </Link>
                                        <Button
                                            type="secondary"
                                            onClick={showView("importModal")}
                                            icon="download"
                                            label={t`Import`}
                                        />
                                    </ButtonGroup>*/}
                                </View.Header>
                                <View.Body>
                                    <ListData
                                        withRouter
                                        entity="Entity"
                                        fields="classId name permissions"
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
                                                            >
                                                                {({ data }) => (
                                                                    <span>
                                                                        <strong>
                                                                            {data.classId}
                                                                        </strong>
                                                                        <br />
                                                                        {data.name}
                                                                    </span>
                                                                )}
                                                            </Table.Field>

                                                            {[
                                                                { key: "owner", label: t`Owner` },
                                                                { key: "group", label: t`Group` },
                                                                { key: "other", label: t`Other` }
                                                            ].map(permissionClass => {
                                                                return (
                                                                    <Table.Field
                                                                        key={permissionClass.key}
                                                                        name={permissionClass.key}
                                                                        align={"center"}
                                                                        label={
                                                                            permissionClass.label
                                                                        }
                                                                    >
                                                                        {({ data }) =>
                                                                            [
                                                                                "create",
                                                                                "read",
                                                                                "update",
                                                                                "delete"
                                                                            ].map(operation => {
                                                                                return (
                                                                                    <TogglePermissionButton
                                                                                        disabled={permissionClass.key !== 'other' && _.get(
                                                                                            data,
                                                                                            `permissions.other.operations.${operation}`
                                                                                        )}
                                                                                        key={`${
                                                                                            permissionClass.key
                                                                                        }_${operation}`}
                                                                                        label={operation
                                                                                            .charAt(
                                                                                                0
                                                                                            )
                                                                                            .toUpperCase()}
                                                                                        value={_.get(
                                                                                            data,
                                                                                            `permissions.${
                                                                                                permissionClass.key
                                                                                            }.operations.${operation}`
                                                                                        )}
                                                                                        onClick={async () => {
                                                                                            await this.toggleOperation(
                                                                                                data.classId,
                                                                                                operation,
                                                                                                permissionClass.key
                                                                                            );

                                                                                            listProps.actions.loadRecords();
                                                                                        }}
                                                                                    />
                                                                                );
                                                                            })
                                                                        }
                                                                    </Table.Field>
                                                                );
                                                            })}
                                                        </Table.Row>
                                                    </Table>
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
                            <ExportEntityModal
                                data={data}
                                api="/security/entities"
                                fields="name,slug,description,entities"
                                label={t`Entity`}
                            />
                        )}
                    </ViewSwitcher.View>

                    <ViewSwitcher.View name="importModal" modal>
                        {() => (
                            <ImportEntityModal
                                api="/security/entities"
                                label={t`Entity`}
                                onImported={() => this.list.loadData()}
                            />
                        )}
                    </ViewSwitcher.View>*/}
                </ViewSwitcher>
            </AdminLayout>
        );
    }
}

export default createComponent(EntitiesList, {
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
