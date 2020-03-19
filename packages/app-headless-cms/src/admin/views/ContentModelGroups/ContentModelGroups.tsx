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

function ContentModelGroups() {
    return (
        <CrudProvider
            delete={{
                mutation: DELETE_CONTENT_MODEL_GROUP,
                options: { refetchQueries: ["HeadlessCmsListMenuContentGroupsModels"] }
            }}
            read={GET_CONTENT_MODEL_GROUP}
            create={{
                mutation: CREATE_CONTENT_MODEL_GROUP,
                options: { refetchQueries: ["HeadlessCmsListMenuContentGroupsModels"] }
            }}
            update={UPDATE_CONTENT_MODEL_GROUP}
            list={{
                query: LIST_CONTENT_MODEL_GROUPS,
                variables: { sort: { savedOn: -1 } }
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
