import React, { useState } from "react";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
import { CircularProgress } from "@webiny/ui/Progress";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView";
import { Provider as ContentEntriesProvider } from "~/admin/views/contentEntries/ContentEntriesContext";
import { GET_CONTENT_MODEL } from "~/admin/graphql/contentModels";
import { useQuery } from "../../hooks";
import ContentEntriesList from "~/admin/views/contentEntries/ContentEntriesList";
import ContentEntry from "~/admin/views/contentEntries/ContentEntry";
import { Provider as ContentEntryProvider } from "./ContentEntry/ContentEntryContext";

const t = i18n.ns("app-headless-cms/admin/content-entries");

const ContentEntries = () => {
    const { match } = useRouter();
    const [contentModel, setContentModel] = useState<any>();
    const { history } = useRouter();
    const modelId = get(match, "params.modelId");
    const { showSnackbar } = useSnackbar();

    useQuery(GET_CONTENT_MODEL, {
        skip: !modelId,
        variables: { modelId },
        onCompleted: data => {
            const contentModel = get(data, "getContentModel.data");
            if (contentModel) {
                return setContentModel(contentModel);
            }

            history.push("/cms/content-models");
            showSnackbar(
                t`Could not load content for model "{modelId}". Redirecting...`({
                    modelId
                })
            );
        }
    });

    if (!contentModel) {
        return <CircularProgress label={t`Loading content model...`} />;
    }

    return (
        <ContentEntriesProvider contentModel={contentModel} key={contentModel.modelId}>
            <SplitView>
                <LeftPanel span={4}>
                    <ContentEntriesList />
                </LeftPanel>
                <RightPanel span={8}>
                    <ContentEntryProvider>
                        <ContentEntry />
                    </ContentEntryProvider>
                </RightPanel>
            </SplitView>
        </ContentEntriesProvider>
    );
};

export default ContentEntries;
