import React, { Fragment } from "react";
import _ from "lodash";
import { i18n, Component } from "webiny-client";

const t = i18n.namespace("Security.UsersList");

@Component({
    modules: [
        { AdminLayout: "Admin.Layout" },
        "View",
        "List",
        "ListData",
        "Link",
        "Icon",
        "Loader",
        "Input"
    ]
})
class UsersList extends React.Component {
    constructor(props) {
        super(props);
        this.renderFullNameField = this.renderFullNameField.bind(this);
    }

    renderFullNameField(row) {
        let fullName = _.trim(`${row.data.firstName} ${row.data.lastName}`);
        fullName = _.isEmpty(fullName) ? row.data.email : fullName;
        return (
            <span>
                <strong>{fullName}</strong>
                <br />
                {row.data.id}
            </span>
        );
    }

    render() {
        const { View, List, ListData, Link, Icon, Input, AdminLayout, Loader } = this.props.modules;
        const Table = List.Table;

        return (
            <AdminLayout>
                <View.List>
                    <View.Header title={t`Security - Users`}>
                        <Link type="primary" route="Users.Create" align="right">
                            <Icon icon="plus-circle" />
                            {t`Create user`}
                        </Link>
                    </View.Header>
                    <View.Body>
                        <ListData
                            withRouter
                            entity="SecurityUser"
                            fields="id enabled firstName lastName email createdOn gravatar"
                            search={{ fields: ["firstName", "lastName", "email"] }}
                        >
                            {({ loading, ...listProps }) => (
                                <Fragment>
                                    {loading && <Loader />}
                                    <List {...listProps}>
                                        <List.FormFilters>
                                            {({ apply, Bind }) => (
                                                <Bind name="search.query">
                                                    <Input placeholder={t`Search by name or email`} onEnter={apply()} />
                                                </Bind>
                                            )}
                                        </List.FormFilters>
                                        <Table>
                                            <Table.Row>
                                                <Table.GravatarField name="gravatar" />
                                                <Table.Field
                                                    name="firstName"
                                                    label={t`First Name`}
                                                    sort="firstName"
                                                    route="Users.Edit"
                                                >
                                                    {this.renderFullNameField}
                                                </Table.Field>
                                                <Table.Field
                                                    name="email"
                                                    sort="email"
                                                    label={t`Email`}
                                                />
                                                <Table.ToggleField
                                                    name="enabled"
                                                    label={t`Status`}
                                                    sort="enabled"
                                                    align="center"
                                                    message={({ value }) => {
                                                        if (value) {
                                                            return null;
                                                        }
                                                        return t`This will disable user's account and prevent him from logging in!`;
                                                    }}
                                                />
                                                <Table.DateField
                                                    name="createdOn"
                                                    label={t`Created On`}
                                                    sort="createdOn"
                                                />
                                                <Table.Actions>
                                                    <Table.EditAction route="Users.Edit" />
                                                    <Table.DeleteAction />
                                                </Table.Actions>
                                            </Table.Row>
                                            <Table.Footer />
                                        </Table>
                                        <List.Pagination />
                                    </List>
                                </Fragment>
                            )}
                        </ListData>
                    </View.Body>
                </View.List>
            </AdminLayout>
        );
    }
}

export default UsersList;
