// @flow
import * as React from "react";
import { graphql } from "react-apollo";
import { pick } from "lodash";
import { get } from "dot-prop-immutable";
import { compose, withProps, withHandlers, withState } from "recompose";
import { CompactView, LeftPanel, RightPanel } from "webiny-app-admin/components/Views/CompactView";
import FloatingActionButton from "webiny-app-admin/components/FloatingActionButton";
import { withDataList, withRouter } from "webiny-app/components";
import { withSnackbar } from "webiny-app-admin/components";
import { i18n } from "webiny-app/i18n";

import RolesDataList from "./Roles/RolesDataList";
import RolesForm from "./Roles/RolesForm";
import { loadRoles, loadScopes, createRole, updateRole, deleteRole } from "./Roles/graphql";

const t = i18n.namespace("Security.Roles");

const Roles = ({ id, router, dataListProps, saveRole, deleteRole, scopes }: Object) => {
    return (
        <React.Fragment>
            <CompactView>
                <LeftPanel>
                    <RolesDataList
                        router={router}
                        dataListProps={dataListProps}
                        deleteRole={deleteRole}
                    />
                </LeftPanel>
                <RightPanel>
                    <RolesForm
                        onSubmit={saveRole}
                        id={id}
                        scopes={scopes}
                        refreshList={dataListProps.refresh}
                    />
                </RightPanel>
            </CompactView>
            <FloatingActionButton
                onClick={() =>
                    router.goToRoute({
                        params: { id: null },
                        merge: true
                    })
                }
            />
        </React.Fragment>
    );
};

export default compose(
    withSnackbar(),
    withRouter(),
    withDataList({
        name: "dataListProps",
        query: loadRoles,
        variables: { sort: { savedOn: -1 } }
    }),
    graphql(loadScopes, {
        props: ({ data }) => ({
            scopes: (get(data, "security.scopes") || []).map(s => ({ name: s, id: s }))
        })
    }),
    graphql(createRole, { name: "createRoleMutation" }),
    graphql(updateRole, { name: "updateRoleMutation" }),
    graphql(deleteRole, { name: "deleteRoleMutation" }),
    withState("formErrors", "setFormErrors", {}),
    withProps(({ router, dataListProps }) => ({
        id: router.getQuery("id"),
        refreshList: dataListProps.refresh
    })),
    withHandlers({
        saveRole: ({
            id,
            router,
            showSnackbar,
            updateRoleMutation,
            createRoleMutation,
            setFormErrors,
            refreshList
        }) => (data: Object) => {
            const payload = pick(data, ["name", "slug", "description", "scopes"]);
            const operation = id
                ? updateRoleMutation({ variables: { id, data: payload } })
                : createRoleMutation({ variables: { data: payload } });
            return operation.then(res => {
                const { data, error } = res.data.security.role;
                if (error) {
                    return setFormErrors(error.data);
                }
                showSnackbar(t`Role {name} saved successfully.`({ name: data.name }));
                router.goToRoute({ params: { id: data.id }, merge: true });
                !id && refreshList();
            });
        },
        deleteRole: ({
            id,
            router,
            deleteRoleMutation,
            showSnackbar,
            refreshList
        }: Object) => async (item: Object) => {
            const res = await deleteRoleMutation({ variables: { id: item.id } });
            const { data, error } = res.data.security.deleteRole;

            if (data) {
                showSnackbar(
                    t`Role {name} deleted.`({
                        name: item.name
                    })
                );
            } else {
                showSnackbar(error.message);
            }

            if (item.id === id) {
                router.goToRoute({
                    params: { id: null },
                    merge: true
                });
            }

            refreshList();
        }
    })
)(Roles);
