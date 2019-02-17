// @flow
import * as React from "react";
import { pick } from "lodash";
import { get } from "dot-prop-immutable";
import { compose } from "recompose";
import { CompactView, LeftPanel, RightPanel } from "webiny-admin/components/CompactView";
import FloatingActionButton from "webiny-admin/components/FloatingActionButton";
import { withCrud, type WithCrudProps } from "webiny-admin/components";
import { i18n } from "webiny-app/i18n";

import GroupsDataList from "./Groups/GroupsDataList";
import GroupsForm from "./Groups/GroupsForm";
import { loadGroup, loadGroups, createGroup, updateGroup, deleteGroup } from "./Groups/graphql";

const t = i18n.namespace("Security.Groups");

const Groups = ({
    scopes,
    router,
    formProps,
    listProps
}: WithCrudProps & { scopes: Array<string> }) => {
    return (
        <React.Fragment>
            <CompactView>
                <LeftPanel>
                    <GroupsDataList {...listProps} />
                </LeftPanel>
                <RightPanel>
                    <GroupsForm scopes={scopes} {...formProps} />
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
    withCrud({
        list: {
            get: {
                query: loadGroups,
                variables: { sort: { savedOn: -1 } },
                response: data => get(data, "security.groups") || { data: {} }
            },
            delete: {
                mutation: deleteGroup,
                response: data => data.security.deleteGroup,
                snackbar: data => t`Group {name} deleted.`({ name: data.name })
            }
        },
        form: {
            get: {
                query: loadGroup,
                response: data => get(data, "security.group") || { data: {} }
            },
            save: {
                create: createGroup,
                update: updateGroup,
                response: data => get(data, "security.group"),
                variables: form => ({
                    data: {
                        ...pick(form, ["name", "slug", "description"]),
                        roles: (form.roles || []).map(x => x.id)
                    }
                }),
                snackbar: data => t`Group {name} saved successfully.`({ name: data.name })
            }
        }
    })
)(Groups);
