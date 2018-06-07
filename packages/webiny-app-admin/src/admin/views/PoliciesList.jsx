import React, { Fragment } from "react";

import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.PoliciesList");

class PoliciesList extends React.Component {
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

        return (
            <AdminLayout>
                <ViewSwitcher>
                    <ViewSwitcher.View name="listView" defaultView>
                        {({ showView }) => (
                            <View.List>
                                <View.Header
                                    title={t`Security - Policies`}
                                    description={
                                        <span>
                                            {t`Policies are a simple way to control what permissions certain users have.`}
                                        </span>
                                    }
                                >
                                    <ButtonGroup>
                                        <Link type="primary" route="Policies.Create">
                                            <Icon icon="plus-circle" />
                                            {t`Create policy`}
                                        </Link>

                                       {/* <Button
                                            type="secondary"
                                            onClick={showView("importModal")}
                                            icon="upload"
                                            label={t`Import`}
                                        />*/}
                                    </ButtonGroup>
                                </View.Header>
                                <View.Body>
                                    <ListData
                                        withRouter
                                        entity="SecurityPolicy"
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
                                                                            route="Policies.Edit"
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
                                                                <Table.EditAction route="Policies.Edit" />
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
                </ViewSwitcher>
            </AdminLayout>
        );
    }
}

export default createComponent(PoliciesList, {
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
