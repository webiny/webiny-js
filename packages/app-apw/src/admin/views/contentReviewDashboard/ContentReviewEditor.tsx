import React from "react";
import { useRouter } from "@webiny/react-router";
import Editor from "~/admin/components/ContentReviewEditor";

interface MatchQuery {
    contentReviewId: string;
}

function ContentReviewEditor() {
    const { match } = useRouter();
    const { contentReviewId } = match.params as MatchQuery;

    return (
        <div data-id={contentReviewId}>
            <Editor />
        </div>
    );
}

export default ContentReviewEditor;
