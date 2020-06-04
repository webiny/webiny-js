import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import EnvironmentsDataList from "./EnvironmentsDataList";
import EnvironmentsForm from "./EnvironmentsForm";
import { CrudProvider } from "@webiny/app-admin/contexts/Crud";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";
import {
    READ_ENVIRONMENT,
    LIST_ENVIRONMENTS,
    CREATE_ENVIRONMENT,
    UPDATE_ENVIRONMENT,
    DELETE_ENVIRONMENT
} from "./graphql";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/environments");

function Environments() {
    const {
        environments: { refreshEnvironments, isSelectedEnvironment }
    } = useCms();

    return (
        <CrudProvider
            delete={{
                mutation: DELETE_ENVIRONMENT,
                snackbar: item => {
                    if (isSelectedEnvironment(item)) {
                        return t`Record deleted successfully. Switched to first available environment.`;
                    }
                    return t`Record deleted successfully.`;
                }
            }}
            read={READ_ENVIRONMENT}
            create={{
                mutation: CREATE_ENVIRONMENT,
                options: {
                    onCompleted: refreshEnvironments
                }
            }}
            update={{
                mutation: UPDATE_ENVIRONMENT
            }}
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
