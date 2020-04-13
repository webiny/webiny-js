import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import ContentDataList from "./ContentDataList";
import ContentForm from "./ContentForm";
import { CrudProvider } from "@webiny/app-admin/contexts/Crud";
import { useApolloClient, useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { GET_CONTENT_MODEL_BY_MODEL_ID } from "./graphql";
import useRouter from "use-react-router";
import get from "lodash.get";
import gql from "graphql-tag";
import createCrudQueriesAndMutations from "./createCrudQueriesAndMutations";

function Content() {
    const { match } = useRouter();

    const modelId = get(match, "params.modelId");
    const { data, loading } = useQuery(GET_CONTENT_MODEL_BY_MODEL_ID, {
        skip: !modelId,
        variables: { modelId }
    });

    const apolloClient = useApolloClient();

    if (!data) {
        return null;
    }

    const contentModel = data.getContentModel.data;
    const crud = createCrudQueriesAndMutations(contentModel);

    return (
        <CrudProvider
            delete={{
                mutation: gql`
                    ${crud.delete}
                `,
                options: {
                    client: apolloClient
                }
            }}
            read={{
                query: gql`
                    ${crud.read}
                `,
                options: {
                    client: apolloClient
                }
            }}
            create={{
                mutation: gql`
                    ${crud.create}
                `,
                options: {
                    client: apolloClient
                }
            }}
            update={{
                mutation: gql`
                    ${crud.update}
                `,
                options: {
                    client: apolloClient
                }
            }}
            list={{
                query: gql`
                    ${crud.list}
                `,
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
                            <ContentDataList contentModel={contentModel} />
                        </LeftPanel>
                        <RightPanel span={8}>
                            <ContentForm contentModel={contentModel} />
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
