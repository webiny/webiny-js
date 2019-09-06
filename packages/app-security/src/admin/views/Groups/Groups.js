import React from "react";
import { pick } from "lodash";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import GroupsDataList from "./GroupsDataList";
import GroupsForm from "./GroupsForm";
import { READ_GROUP, LIST_GROUPS, CREATE_GROUP, UPDATE_GROUP, DELETE_GROUP } from "./graphql";
import { CrudProvider } from "@webiny/app-admin/context/CrudContext";

const Groups = ({ scopes, formProps, listProps }) => {
    const variables = data => ({
        data: {
            ...pick(data, ["name", "slug", "description"]),
            roles: (data.roles || []).map(x => x.id)
        }
    });

    return (
        <React.Fragment>
            <CrudProvider
                delete={DELETE_GROUP}
                read={READ_GROUP}
                list={{
                    query: LIST_GROUPS,
                    variables: { sort: { savedOn: -1 } }
                }}
                update={{
                    mutation: UPDATE_GROUP,
                    variables
                }}
                create={{
                    mutation: CREATE_GROUP,
                    variables
                }}
            >
                {({ actions }) => (
                    <>
                        <SplitView>
                            <LeftPanel>
                                <GroupsDataList {...listProps} />
                            </LeftPanel>
                            <RightPanel>
                                <GroupsForm scopes={scopes} {...formProps} />
                            </RightPanel>
                        </SplitView>
                        <FloatingActionButton onClick={actions.resetForm} />
                    </>
                )}
            </CrudProvider>
        </React.Fragment>
    );
};

export default Groups;
