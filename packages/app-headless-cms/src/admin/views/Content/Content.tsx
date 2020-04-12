import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import ContentDataList from "./ContentDataList";
import ContentForm from "./ContentForm";
import { CrudProvider } from "@webiny/app-admin/contexts/Crud";
import { useApolloClient, useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { GET_CONTENT_MODEL_BY_MODEL_ID } from "./graphql";
import useRouter from "use-react-router";

function Content() {
    const {match} = useRouter();

    const {modelId} = match?.params || {};
    const getContentModelByModelId = useQuery(GET_CONTENT_MODEL_BY_MODEL_ID);
    console.log(getContentModelByModelId);

    return null;

    return;

    const apolloClient = useApolloClient();
    return (
        <CrudProvider
            delete={{
                mutation: DELETE_CONTENT_CONTENT,
                options: {
                    client: apolloClient
                }
            }}
            read={{
                query: GET_CONTENT_CONTENT,
                options: {
                    client: apolloClient
                }
            }}
            create={{
                mutation: CREATE_CONTENT_CONTENT,
                options: {
                    client: apolloClient
                }
            }}
            update={{
                mutation: UPDATE_CONTENT_CONTENT,
                options: {
                    client: apolloClient
                }
            }}
            list={{
                query: LIST_CONTENT_CONTENT,
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
                            <ContentDataList />
                        </LeftPanel>
                        <RightPanel span={8}>
                            <ContentForm />
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

export default Content;
