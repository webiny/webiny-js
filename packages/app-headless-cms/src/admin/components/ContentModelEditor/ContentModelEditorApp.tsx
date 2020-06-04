import React from "react";
import useReactRouter from "use-react-router";
import { ContentModelEditorProvider } from "./Context";
import ContentModelEditor from "./ContentModelEditor";
import { match } from "react-router";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";

type QueryMatch = {
    id?: string;
};

const ContentModelEditorApp = () => {
    const router = useReactRouter();

    const {
        environments: { apolloClient }
    } = useCms();

    const matched: match<QueryMatch> = router.match;
    const { id } = matched.params;

    if (!apolloClient) {
        return null;
    }

    return (
        <ContentModelEditorProvider
            key={id}
            apollo={apolloClient}
            id={id}
            defaultLayoutRenderer={"forms-form-layout-default"}
        >
            <ContentModelEditor />
        </ContentModelEditorProvider>
    );
};

export default ContentModelEditorApp;
