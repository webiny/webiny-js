import React, { useState } from "react";
import get from "lodash/get";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
import { GET_CONTENT_MODEL } from "../components/ContentModelEditor/Context/graphql";
import { ContentEntries } from "./ContentEntries";
import { CircularProgress } from "@webiny/ui/Progress";

const t = i18n.ns("app-headless-cms/admin/content");

const ContentEntriesContainer = () => {
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
                t`Could not load content for "{modelId}" model. Redirecting...`({
                    modelId
                })
            );
        }
    });

    if (!contentModel) {
        return <CircularProgress label={"Loading content model..."} />;
    }

    // Added "key" prop which somehow fixes the "Internal Error: may not update existing query string in store" error
    // that would occur when doing a search on a different content model (via the global search bar).
    // Didn't find what was actually causing the issue, nor did the Google return any results for the error above.
    return <ContentEntries contentModel={contentModel} key={contentModel.modelId} />;
};

export default ContentEntriesContainer;
