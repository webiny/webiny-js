import React, { useCallback } from "react";
import { withRouter } from "react-router-dom";
import { get } from "dot-prop-immutable";
import { pick } from "lodash";
import { i18n } from "@webiny/app/i18n";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";
import UsersDataList from "./Users/UsersDataList";
import UsersForm from "./Users/UsersForm";
import { createUser, deleteUser, loadUser, loadUsers, updateUser } from "./Users/graphql";
import useRouter from "use-react-router";

const t = i18n.namespace("Security.Users");

const Users = () => {
    const createNew = useCallback(() => {
        const query = new URLSearchParams(location.search);
        query.delete("id");
        history.push({ search: query.toString() });
    });

    const { location, history } = useRouter();

    const { formProps, listProps } = useCrud({
        history,
        location,
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

export default withRouter(Users);
