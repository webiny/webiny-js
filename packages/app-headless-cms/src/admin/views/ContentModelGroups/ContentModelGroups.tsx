import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import ContentModelGroupsDataList from "./ContentModelGroupsDataList";
import ContentModelGroupsForm from "./ContentModelGroupsForm";
import { CrudProvider } from "@webiny/app-admin/contexts/Crud";
import {
    GET_CONTENT_MODEL_GROUP,
    LIST_CONTENT_MODEL_GROUPS,
    CREATE_CONTENT_MODEL_GROUP,
    UPDATE_CONTENT_MODEL_GROUP,
    DELETE_CONTENT_MODEL_GROUP
} from "./graphql";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";

function ContentModelGroups() {
    const {
        environments: { apolloClient }
    } = useCms();

    return (
        <CrudProvider
            delete={{
                mutation: DELETE_CONTENT_MODEL_GROUP,
                options: {
                    client: apolloClient,
                    refetchQueries: ["HeadlessCmsListMenuContentGroupsModels"]
                }
            }}
            read={{
                query: GET_CONTENT_MODEL_GROUP,
                options: {
                    client: apolloClient
                }
            }}
            create={{
                mutation: CREATE_CONTENT_MODEL_GROUP,
                options: {
                    client: apolloClient,
                    refetchQueries: ["HeadlessCmsListMenuContentGroupsModels"]
                }
            }}
            update={{
                mutation: UPDATE_CONTENT_MODEL_GROUP,
                options: {
                    client: apolloClient
                }
            }}
            list={{
                query: LIST_CONTENT_MODEL_GROUPS,
                variables: { sort: { savedOn: -1 } },
                options: {
                    client: apolloClient
                }
            }}
        >
            {({ actions }) => (
                <>
                    <SplitView>
                        <LeftPanel span={4}>
                            <ContentModelGroupsDataList />
                        </LeftPanel>
                        <RightPanel span={8}>
                            <ContentModelGroupsForm />
                        </RightPanel>
                    </SplitView>
                    <FloatingActionButton
                        data-testid="new-record-button"
                        onClick={actions.resetForm}
                    />
                </>
            )}
        </CrudProvider>
    );
}

export default ContentModelGroups;
