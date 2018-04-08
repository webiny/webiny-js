import React from "react";
import _ from "lodash";
import { i18n, createComponent } from "webiny-app";

const t = i18n.namespace("Security.UsersList");

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
        const { View, List, Link, Icon, Input, AdminLayout } = this.props;
        const Table = List.Table;

        const roles = <Link route="Roles.List">{t`Roles`}</Link>;
        const permissions = <Link route="Permissions.List">{t`Permissions`}</Link>;

        return (
            <AdminLayout>
                <View.List>
                    <View.Header
                        title={t`Security - Users`}
                        description={
                            <span>
                                {t`Once your system {permissions} and {roles} are defined,
                                    you can create your system users here.`({ roles, permissions })}
                            </span>
                        }
                    >
                        <Link type="primary" route="Users.Create" align="right">
                            <Icon icon="plus-circle" />
                            {t`Create user`}
                        </Link>
                    </View.Header>
                    <View.Body>
                        <List
                            withRouter
                            entity="SecurityUser"
                            fields="id enabled firstName lastName email createdOn gravatar"
                            search={{ fields: ["firstName", "lastName", "email"] }}
                        >
                            <List.FormFilters>
                                {({ apply }) => (
                                    <Input
                                        name="search.query"
                                        placeholder={t`Search by name or email`}
                                        onEnter={apply()}
                                    />
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
                                    <Table.Field name="email" sort="email" label={t`Email`} />
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
                    </View.Body>
                </View.List>
            </AdminLayout>
        );
    }
}

export default createComponent(UsersList, {
    modules: [{ AdminLayout: "Admin.Layout" }, "View", "List", "Link", "Icon", "Input"]
});
