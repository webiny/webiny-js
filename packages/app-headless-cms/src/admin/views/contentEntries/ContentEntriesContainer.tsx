import React, { useState } from "react";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
import { CircularProgress } from "@webiny/ui/Progress";
import {
    GET_CONTENT_MODEL,
    GetCmsModelQueryResponse,
    GetCmsModelQueryVariables
} from "~/admin/graphql/contentModels";
import { useQuery } from "../../hooks";
import { CmsModel } from "@webiny/app-headless-cms-common/types";
import { ModelProvider } from "~/admin/components/ModelProvider";

const t = i18n.ns("app-headless-cms/admin/content-entries");

interface Props {
    children: React.ReactNode;
}
export const ContentEntriesContainer: React.VFC<Props> = ({ children }) => {
    const { params } = useRouter();
    const modelId = params?.modelId;
    const [contentModel, setContentModel] = useState<CmsModel | null>(null);
    const { history } = useRouter();
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

    return <ModelProvider model={contentModel}>{children}</ModelProvider>;
};
