import React, { useState } from "react";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
import { CircularProgress } from "@webiny/ui/Progress";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView";
import { Provider as ContentEntriesProvider } from "~/admin/views/contentEntries/ContentEntriesContext";
import {
    GET_CONTENT_MODEL,
    GetCmsModelQueryResponse,
    GetCmsModelQueryVariables
} from "~/admin/graphql/contentModels";
import { useQuery } from "../../hooks";
import ContentEntriesList from "~/admin/views/contentEntries/ContentEntriesList";
import { ContentEntry } from "~/admin/views/contentEntries/ContentEntry";
import { Provider as ContentEntryProvider } from "./ContentEntry/ContentEntryContext";
import { CmsModel } from "~/types";
import { ModelProvider } from "~/admin/components/ModelProvider";

const t = i18n.ns("app-headless-cms/admin/content-entries");

const ContentEntries: React.FC = () => {
    const { params } = useRouter();
    const modelId = params ? params["modelId"] : null;
    const [contentModel, setContentModel] = useState<CmsModel | null>(null);
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const { loading, error } = useQuery<GetCmsModelQueryResponse, GetCmsModelQueryVariables>(
        GET_CONTENT_MODEL,
        {
            skip: !modelId,
            variables: {
                modelId
            },
            onCompleted: data => {
                const contentModel = get(data, "getContentModel.data", null);
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
        }
    );

    if (!contentModel || loading) {
        return <CircularProgress label={t`Loading content model...`} />;
    } else if (error) {
        showSnackbar(error.message);
        return null;
    }

    return (
        <ModelProvider model={contentModel}>
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
        </ModelProvider>
    );
};

export default ContentEntries;
