import React from "react";
import { useApolloClient } from "react-apollo";
import useReactRouter from "use-react-router";
import { ContentModelEditorProvider } from "./Context";
import ContentModelEditor from "./ContentModelEditor";
import { match } from "react-router";

const ContentModelEditorApp = () => {
    const router = useReactRouter();
    const client = useApolloClient();

    const matched: match<{
        id?: string;
    }> = router.match;
    const { id } = matched.params;

    return (
        <ContentModelEditorProvider
            key={id}
            apollo={client}
            id={id}
            defaultLayoutRenderer={"forms-form-layout-default"}
        >
            <ContentModelEditor />
        </ContentModelEditorProvider>
    );
};

export default ContentModelEditorApp;
