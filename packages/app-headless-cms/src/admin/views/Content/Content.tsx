import React, { useMemo } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { useDataList } from "@webiny/app/hooks/useDataList";
import ContentDataList from "./ContentDataList";
import ContentDetails from "./ContentDetails";
import { createListQuery } from "@webiny/app-headless-cms/admin/components/ContentModelForm/graphql";
import useRouter from "use-react-router";
import get from "lodash.get";
import { useApolloClient, useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { GET_CONTENT_MODEL_BY_MODEL_ID } from "./graphql";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import useReactRouter from "use-react-router";

const ContentRender = ({ contentModel }) => {
    const apolloClient = useApolloClient();
    const { history } = useReactRouter();

    const LIST_QUERY = useMemo(() => createListQuery(contentModel), [contentModel.modelId]);

    const dataList = useDataList({
        client: apolloClient,
        query: LIST_QUERY
    });

    return (
        <React.Fragment>
            <SplitView>
                <LeftPanel span={4}>
                    <ContentDataList dataList={dataList} contentModel={contentModel} />
                </LeftPanel>
                <RightPanel span={8}>
                    <ContentDetails dataList={dataList} contentModel={contentModel} />
                </RightPanel>
            </SplitView>
            <FloatingActionButton data-testid="new-record-button" onClick={() => {
                const query = new URLSearchParams(location.search);
                query.delete("id");
                history.push({ search: query.toString() });
            }} />
        </React.Fragment>
    );
};

const Content = () => {
    const { match } = useRouter();
    const modelId = get(match, "params.modelId");
    const { data } = useQuery(GET_CONTENT_MODEL_BY_MODEL_ID, {
        skip: !modelId,
        variables: { modelId }
    });

    if (!data) {
        return null;
    }

    return <ContentRender contentModel={data.getContentModel.data} />;
};

export default Content;
