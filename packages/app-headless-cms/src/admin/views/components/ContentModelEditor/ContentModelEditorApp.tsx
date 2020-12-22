import React from "react";
import { useRouter } from "@webiny/react-router";
import { ContentModelEditorProvider } from "./Context";
import ContentModelEditor from "./ContentModelEditor";
import { match } from "react-router";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";

type QueryMatch = {
    modelId?: string;
};

const ContentModelEditorApp = () => {
    const router = useRouter();

    const { apolloClient } = useCms();

    const matched: match<QueryMatch> = router.match;
    const { modelId } = matched.params;

    if (!apolloClient) {
        return null;
    }

    return (
        <ContentModelEditorProvider key={modelId} apollo={apolloClient} modelId={modelId}>
            <ContentModelEditor />
        </ContentModelEditorProvider>
    );
};

export default ContentModelEditorApp;
