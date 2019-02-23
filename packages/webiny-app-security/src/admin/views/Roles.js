// @flow
import * as React from "react";
import { graphql } from "react-apollo";
import { pick } from "lodash";
import { get } from "dot-prop-immutable";
import { compose } from "recompose";
import { SplitView, LeftPanel, RightPanel } from "webiny-admin/components/SplitView";
import { FloatingActionButton } from "webiny-admin/components/FloatingActionButton";
import { withCrud, type WithCrudProps } from "webiny-admin/components";
import { i18n } from "webiny-app/i18n";

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

const Roles = ({
    scopes,
    router,
    formProps,
    listProps
}: WithCrudProps & { scopes: Array<string> }) => {
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
