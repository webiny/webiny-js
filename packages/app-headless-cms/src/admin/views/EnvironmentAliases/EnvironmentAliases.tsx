import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import EnvironmentAliasesDataList from "./EnvironmentAliasesDataList";
import EnvironmentAliasesForm from "./EnvironmentAliasesForm";
import { CrudProvider } from "@webiny/app-admin/contexts/Crud";
import {
    READ_ENVIRONMENT_ALIAS,
    LIST_ENVIRONMENT_ALIASES,
    CREATE_ENVIRONMENT_ALIAS,
    UPDATE_ENVIRONMENT_ALIAS,
    DELETE_ENVIRONMENT_ALIAS
} from "./graphql";
import { LIST_ENVIRONMENTS } from "@webiny/app-headless-cms/admin/views/Environments/graphql";
import { updateCacheAfterCreate } from "./environmentAliasesUtils";

function EnvironmentAliases() {
    return (
        <CrudProvider
            delete={{
                mutation: DELETE_ENVIRONMENT_ALIAS,
                options: {
                    refetchQueries: [
                        { query: LIST_ENVIRONMENTS, variables: { sort: { savedOn: -1 } } }
                    ]
                }
            }}
            read={READ_ENVIRONMENT_ALIAS}
            create={{
                mutation: CREATE_ENVIRONMENT_ALIAS,
                options: {
                    update: updateCacheAfterCreate
                }
            }}
            update={{
                mutation: UPDATE_ENVIRONMENT_ALIAS
            }}
            list={{
                query: LIST_ENVIRONMENT_ALIASES,
                variables: { sort: { savedOn: -1 } }
            }}
        >
            {({ actions }) => (
                <>
                    <SplitView>
                        <LeftPanel span={4}>
                            <EnvironmentAliasesDataList />
                        </LeftPanel>
                        <RightPanel span={8}>
                            <EnvironmentAliasesForm />
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

export default EnvironmentAliases;
