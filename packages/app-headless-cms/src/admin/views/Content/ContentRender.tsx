import React, { useMemo } from "react";
import get from "lodash.get";
import { useApolloClient } from "@webiny/app-headless-cms/admin/hooks";
import { useRouter } from "@webiny/react-router";
import { createListQuery } from "@webiny/app-headless-cms/admin/components/ContentModelForm/graphql";
import { useDataList } from "@webiny/app/hooks/useDataList";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView";
import ContentDataList from "./ContentDataList";
import ContentDetails from "./ContentDetails";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";

export const ContentRender = ({ contentModel }) => {
    const apolloClient = useApolloClient();
    const { history } = useRouter();

    const LIST_QUERY = useMemo(() => createListQuery(contentModel), [contentModel.modelId]);

    const query = new URLSearchParams(location.search);

    let variables = {};
    if (query.get("search")) {
        // We use the title field with the "contains" operator for doing basic searches.
        const searchField = contentModel.titleFieldId + "_contains";
        variables = {
            where: {
                [searchField]: query.get("search")
            }
        };
    }

    const dataList = useDataList({
        client: apolloClient,
        query: LIST_QUERY,
        variables,
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
