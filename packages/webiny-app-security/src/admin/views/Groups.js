import React, { useCallback } from "react";
import { withRouter } from "react-router-dom";
import { pick } from "lodash";
import { get } from "dot-prop-immutable";
import { compose } from "recompose";
import { SplitView, LeftPanel, RightPanel } from "webiny-app-admin/components/SplitView";
import { FloatingActionButton } from "webiny-app-admin/components/FloatingActionButton";
import { withCrud } from "webiny-app-admin/components";
import { i18n } from "webiny-app/i18n";
import GroupsDataList from "./Groups/GroupsDataList";
import GroupsForm from "./Groups/GroupsForm";
import { loadGroup, loadGroups, createGroup, updateGroup, deleteGroup } from "./Groups/graphql";

const t = i18n.namespace("Security.Groups");

const Groups = ({ scopes, location, history, formProps, listProps }) => {
    const createNew = useCallback(() => {
        const query = new URLSearchParams(location.search);
        query.delete("id");
        history.push({ search: query.toString() });
    });

    return (
        <React.Fragment>
            <SplitView>
                <LeftPanel>
                    <GroupsDataList {...listProps} />
                </LeftPanel>
                <RightPanel>
                    <GroupsForm scopes={scopes} {...formProps} />
                </RightPanel>
            </SplitView>
            <FloatingActionButton onClick={createNew} />
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
    }),
    withRouter
)(Groups);
