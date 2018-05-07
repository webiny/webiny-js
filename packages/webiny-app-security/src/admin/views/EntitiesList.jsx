import React, { Fragment } from "react";

// import ExportEntityModal from "./Modal/ExportModal";
// import ImportEntityModal from "./Modal/ImportModal";
import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.EntitiesList");

class EntitiesList extends React.Component {
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
                    <ViewSwitcher.View name="entitiesList" defaultView>
                        {({ showView }) => (
                            <View.List>
                                <View.Header
                                    title={t`Security - Entities`}
                                    description={
                                        <span>
                                            {t`Entities define what a user is allowed to do with API endpoints.
                                                    Define entities and then group them into {rolesLink}.`(
                                                { rolesLink }
                                            )}
                                        </span>
                                    }
                                >
                                    <ButtonGroup>
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
                                    </ButtonGroup>
                                </View.Header>
                                <View.Body>
                                    <ListData
                                        withRouter
                                        entity="Entity"
                                        fields="id name"
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
                                                                            route="Entities.Edit"
                                                                            params={{ id: data.id }}
                                                                        >
                                                                            <strong>
                                                                                {data.name}
                                                                            </strong>
                                                                        </Link>
                                                                        <br />
                                                                        {data.id}
                                                                    </span>
                                                                )}
                                                            </Table.Field>
                                                            <Table.Actions>
                                                                <Table.EditAction route="Entities.Edit" />

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
