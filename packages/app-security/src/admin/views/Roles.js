import React, { useCallback } from "react";
import { graphql } from "react-apollo";
import { pick } from "lodash";
import { get } from "dot-prop-immutable";
import { compose } from "recompose";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import { withCrud } from "@webiny/app-admin/components";
import { i18n } from "@webiny/app/i18n";

import RolesDataList from "./Roles/RolesDataList";
import RolesForm from "./Roles/RolesForm";
import {
    loadRole,
    loadRoles,
    loadScopes,
    createRole,
    updateRole,
    deleteRole
} from "./Roles/graphql";

const t = i18n.namespace("Security.Roles");

function Roles({ scopes, location, history, formProps, listProps }) {
    const createNew = useCallback(() => {
        const query = new URLSearchParams(location.search);
        query.delete("id");
        history.push({ search: query.toString() });
    });

    return (
        <React.Fragment>
            <SplitView>
                <LeftPanel>
                    <RolesDataList {...listProps} />
                </LeftPanel>
                <RightPanel>
                    <RolesForm scopes={scopes} {...formProps} />
                </RightPanel>
            </SplitView>
            <FloatingActionButton onClick={createNew} />
        </React.Fragment>
    );
}

export default compose(
    withCrud({
        list: {
            get: {
                query: loadRoles,
                variables: { sort: { savedOn: -1 } },
                response: data => get(data, "security.roles")
            },
            delete: {
                mutation: deleteRole,
                response: data => data.security.deleteRole,
                snackbar: data => t`Role {name} deleted.`({ name: data.name })
            }
        },
        form: {
            get: {
                query: loadRole,
                response: data => get(data, "security.role")
            },
            save: {
                create: createRole,
                update: updateRole,
                response: data => data.security.role,
                variables: form => ({
                    data: pick(form, ["name", "slug", "description", "scopes"])
                }),
                snackbar: data => t`Role {name} saved successfully.`({ name: data.name })
            }
        }
    }),
    graphql(loadScopes, {
        props: ({ data }) => ({
            scopes: get(data, "security.scopes") || []
        })
    })
)(Roles);
