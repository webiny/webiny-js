import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import AccessTokensDataList from "./AccessTokensDataList";
import AccessTokensForm from "./AccessTokensForm";
import { CrudProvider } from "@webiny/app-admin/contexts/Crud";
import {
    GET_ACCESS_TOKEN,
    LIST_ACCESS_TOKENS,
    CREATE_ACCESS_TOKEN,
    UPDATE_ACCESS_TOKEN,
    DELETE_ACCESS_TOKEN
} from "./graphql";

function EnvironmentAliases() {
    return (
        <CrudProvider
            delete={{
                mutation: DELETE_ACCESS_TOKEN
            }}
            read={GET_ACCESS_TOKEN}
            create={{
                mutation: CREATE_ACCESS_TOKEN
            }}
            update={{
                mutation: UPDATE_ACCESS_TOKEN
            }}
            list={{
                query: LIST_ACCESS_TOKENS,
                variables: { sort: { savedOn: -1 } }
            }}
        >
            {({ actions }) => (
                <>
                    <SplitView>
                        <LeftPanel span={4}>
                            <AccessTokensDataList />
                        </LeftPanel>
                        <RightPanel span={8}>
                            <AccessTokensForm />
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
