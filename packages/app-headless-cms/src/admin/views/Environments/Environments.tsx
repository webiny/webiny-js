import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import EnvironmentsDataList from "./EnvironmentsDataList";
import EnvironmentsForm from "./EnvironmentsForm";
import { CrudProvider } from "@webiny/app-admin/contexts/Crud";
import { READ_ENVIRONMENT, LIST_ENVIRONMENTS, CREATE_ENVIRONMENT, UPDATE_ENVIRONMENT, DELETE_ENVIRONMENT } from "./graphql";

function Environments() {
    return (
        <CrudProvider
            delete={DELETE_ENVIRONMENT}
            read={READ_ENVIRONMENT}
            create={CREATE_ENVIRONMENT}
            update={UPDATE_ENVIRONMENT}
            list={{
                query: LIST_ENVIRONMENTS,
                variables: { sort: { savedOn: -1 } }
            }}
        >
            {({ actions }) => (
                <>
                    <SplitView>
                        <LeftPanel span={4}>
                            <EnvironmentsDataList />
                        </LeftPanel>
                        <RightPanel span={8}>
                            <EnvironmentsForm />
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

export default Environments;
