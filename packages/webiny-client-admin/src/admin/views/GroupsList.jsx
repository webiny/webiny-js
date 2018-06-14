import React, { Fragment } from "react";

import { i18n, Component } from "webiny-client";
const t = i18n.namespace("Security.GroupsList");

@Component({
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
})
class GroupsList extends React.Component {
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
                                <View.Header title={t`Security - Groups`}>
                                    <ButtonGroup>
                                        <Link type="primary" route="Groups.Create">
                                            <Icon icon="plus-circle" />
                                            {t`Create group`}
                                        </Link>
                                    </ButtonGroup>
                                </View.Header>
                                <View.Body>
                                    <ListData
                                        withRouter
                                        entity="SecurityGroup"
                                        fields="id name slug description createdOn"
                                        search={{ fields: ["name", "slug", "description"] }}
                                    >
                                        {({ loading, ...listProps }) => (
                                            <Fragment>
                                                {loading && <Loader />}

                                                <List {...listProps}>
                                                    <List.FormFilters>
                                                        {({ apply, Bind }) => (
                                                            <Grid.Row>
                                                                <Grid.Col all={12}>
                                                                    <Bind name="search.query">
                                                                        <Input placeholder={t`Search by name, description or slug`} onEnter={apply()} />
                                                                    </Bind>
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
                                                                            route="Groups.Edit"
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
                                                                <Table.EditAction route="Groups.Edit" />
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

export default GroupsList;
