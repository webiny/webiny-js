import React, { useCallback } from "react";
import { withRouter } from "react-router-dom";
import { compose } from "recompose";
import { get } from "dot-prop-immutable";
import { pick } from "lodash";
import { i18n } from "webiny-app/i18n";
import { SplitView, LeftPanel, RightPanel } from "webiny-admin/components/SplitView";
import { FloatingActionButton } from "webiny-admin/components/FloatingActionButton";
import { withCrud } from "webiny-admin/components";
import UsersDataList from "./Users/UsersDataList";
import UsersForm from "./Users/UsersForm";
import { createUser, deleteUser, loadUser, loadUsers, updateUser } from "./Users/graphql";

const t = i18n.namespace("Security.Users");

const Users = ({ formProps, listProps, location, history }) => {
    const createNew = useCallback(() => {
        const query = new URLSearchParams(location.search);
        query.delete("id");
        history.push({ search: query.toString() });
    });

    return (
        <SplitView>
            <LeftPanel>
                <UsersDataList {...listProps} />
            </LeftPanel>
            <RightPanel>
                <UsersForm {...formProps} />
            </RightPanel>

            <FloatingActionButton onClick={createNew} />
        </SplitView>
    );
};

export default compose(
    withCrud({
        list: {
            get: {
                query: loadUsers,
                variables: { sort: { savedOn: -1 } },
                response: data => get(data, "security.users")
            },
            delete: {
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
    }),
    withRouter
)(Users);
