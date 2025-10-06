import React, { useState } from "react";
import get from "lodash/get.js";
import { useRoute, useRouter, useSnackbar } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n/index.js";
import type {
    GetCmsModelQueryResponse,
    GetCmsModelQueryVariables
} from "~/admin/graphql/contentModels.js";
import { GET_CONTENT_MODEL } from "~/admin/graphql/contentModels.js";
import { useQuery } from "../../hooks/index.js";
import type { CmsModel } from "~/types.js";
import { ModelProvider } from "~/admin/components/ModelProvider/index.js";
import { LoadingContentModel } from "~/admin/components/ContentEntries/LoadingContentModel/index.js";
import { Routes } from "~/routes.js";

const t = i18n.ns("app-headless-cms/admin/content-entries");

interface ContentEntriesContainerProps {
    children: React.ReactNode;
}

export const ContentEntriesContainer = ({ children }: ContentEntriesContainerProps) => {
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.ContentEntries.List);
    const { modelId } = route.params;
    const [contentModel, setContentModel] = useState<CmsModel | null>(null);
    const { showSnackbar } = useSnackbar();

    const { loading, error } = useQuery<GetCmsModelQueryResponse, GetCmsModelQueryVariables>(
        GET_CONTENT_MODEL,
        {
            skip: !modelId,
            variables: {
                modelId: modelId as string
            },
            onCompleted: data => {
                const contentModel = get(data, "getContentModel.data", null);
                if (contentModel) {
                    return setContentModel(contentModel);
                }

                goToRoute(Routes.ContentModels.List);
                showSnackbar(
                    t`Could not load model "{modelId}". Redirecting...`({
                        modelId
                    })
                );
            }
        }
    );

    if (!contentModel || loading) {
        return <LoadingContentModel />;
    } else if (error) {
        showSnackbar(error.message);
        return null;
    }

    return <ModelProvider model={contentModel}>{children}</ModelProvider>;
};
