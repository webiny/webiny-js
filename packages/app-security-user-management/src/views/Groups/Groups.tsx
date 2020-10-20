import * as React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import GroupsDataList from "./GroupsDataList";
import GroupsForm from "./GroupsForm";
import { READ_GROUP, LIST_GROUPS, CREATE_GROUP, UPDATE_GROUP, DELETE_GROUP } from "./graphql";
import { CrudProvider } from "@webiny/app-admin/contexts/Crud";

const Groups = ({ scopes, formProps, listProps }: any) => {
    return (
        <React.Fragment>
            <CrudProvider
                delete={DELETE_GROUP}
                read={READ_GROUP}
                list={{
                    query: LIST_GROUPS
                }}
                update={{
                    mutation: UPDATE_GROUP
                }}
                create={{
                    mutation: CREATE_GROUP
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
                        <FloatingActionButton
                            data-testid="new-record-button"
                            onClick={actions.resetForm}
                        />
                    </>
                )}
            </CrudProvider>
        </React.Fragment>
    );
};

export default Groups;
