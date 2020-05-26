import React, { useMemo, useState } from "react";
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
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/content");

const ContentRender = ({ contentModel }) => {
    const apolloClient = useApolloClient();
    const { history } = useReactRouter();

    const LIST_QUERY = useMemo(() => createListQuery(contentModel), [contentModel.modelId]);

    const dataList = useDataList({
        client: apolloClient,
        query: LIST_QUERY,
        getData: response => {
            return get(response, "content.data");
        },
        getMeta: response => {
            return get(response, "content.meta");
        },
        getError: response => {
            return get(response, "content.error");
        }
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
            <FloatingActionButton
                data-testid="new-record-button"
                onClick={() => {
                    const query = new URLSearchParams(location.search);
                    query.delete("id");
                    history.push({ search: query.toString() });
                }}
            />
        </React.Fragment>
    );
};

const Content = () => {
    const { match } = useRouter();
    const [contentModel, setContentModel] = useState();
    const { history } = useReactRouter();
    const modelId = get(match, "params.modelId");
    const { showSnackbar } = useSnackbar();

    useQuery(GET_CONTENT_MODEL_BY_MODEL_ID, {
        skip: !modelId,
        variables: { modelId },
        onCompleted: data => {
            const contentModel = get(data, "getContentModel.data");
            if (contentModel) {
                return setContentModel(contentModel);
            }

            history.push("/cms/content-models");
            showSnackbar(
                t`Could not load content for "{modelId}" model. Redirecting...`({
                    modelId
                })
            );
        }
    });

    if (!contentModel) {
        return null;
    }

    return <ContentRender contentModel={contentModel} />;
};

export default Content;
