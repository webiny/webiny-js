// @flow
import * as React from "react";
import { compose } from "recompose";
import { get } from "dot-prop-immutable";
import { pick } from "lodash";
import { i18n } from "webiny-app/i18n";
import { CompactView, LeftPanel, RightPanel } from "webiny-app-admin/components/Views/CompactView";
import FloatingActionButton from "webiny-app-admin/components/FloatingActionButton";
import { withCrud } from "webiny-app-admin/components";
import UsersDataList from "./Users/UsersDataList";
import UsersForm from "./Users/UsersForm";
import { createUser, deleteUser, loadUser, loadUsers, updateUser } from "./Users/graphql";

const t = i18n.namespace("Security.Users");

const Users = ({ crudList, crudForm, router }: Object) => {
    return (
        <CompactView>
            <LeftPanel>{crudList(<UsersDataList />)}</LeftPanel>
            <RightPanel>{crudForm(<UsersForm />)}</RightPanel>

            <FloatingActionButton
                onClick={() =>
                    router.goToRoute({
                        params: { id: null },
                        merge: true
                    })
                }
            />
        </CompactView>
    );
};

export default withCrud({
    list: {
        get: {
            query: loadUsers,
            variables: { sort: { savedOn: -1 } },
            response: data => get(data, "security.users")
        },
        delete: {
            name: "deleteUser",
            mutation: deleteUser,
            response: data => data.security.deleteUser,
            snackbar: data => t`User {name} deleted.`({ name: data.fullName })
        }
    },
    form: {
        get: {
            query: loadUser,
            response: data => get(data, "security.user")
        },
        save: {
            create: createUser,
            update: updateUser,
            response: data => data.security.user,
            variables: form => {
                return {
                    data: {
                        ...pick(form, [
                            "email",
                            "password",
                            "firstName",
                            "lastName",
                            "avatar",
                            "enabled"
                        ]),
                        roles: (form.roles || []).map(x => x.id),
                        groups: (form.groups || []).map(x => x.id)
                    }
                };
            },
            snackbar: data => t`User {name} saved successfully.`({ name: data.fullName })
        }
    }
})(Users);
