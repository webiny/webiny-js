import React, { useCallback, useMemo, useState } from "react";
import { get } from "lodash";
import { useRouter } from "@webiny/react-router";
import styled from "@emotion/styled";
import { renderPlugins } from "@webiny/app/plugins";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import * as GQL from "../components/ContentModelForm/graphql";

const DetailsContainer = styled("div")({
    overflow: "hidden",
    position: "relative",
    nav: {
        backgroundColor: "var(--mdc-theme-surface)"
    }
});

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "test-id": {
                children?: React.ReactNode;
            };
        }
    }
}
const ContentDetails = ({ contentModel }) => {
    const { history, location } = useRouter();
    const { showSnackbar } = useSnackbar();
    const [state, setState] = useState({});
    // TODO remove eslint disable
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useState(false);

    const query = new URLSearchParams(location.search);
    const contentId = query.get("id");
    const revisionId = contentId ? decodeURIComponent(contentId) : null;
    const entryId = revisionId ? revisionId.split("#")[0] : null;

    const { READ_CONTENT } = useMemo(() => {
        return {
            READ_CONTENT: GQL.createReadQuery(contentModel)
        };
    }, [contentModel.modelId]);

    const { GET_REVISIONS } = useMemo(() => {
        return {
            GET_REVISIONS: GQL.createRevisionsQuery(contentModel)
        };
    }, [contentModel.modelId]);

    const getEntry = useQuery(READ_CONTENT, {
        variables: { revision: decodeURIComponent(contentId) },
        skip: !contentId,
        onCompleted: data => {
            if (!data) {
                return;
            }

            const { error } = data.content;
            if (error) {
                history.push(`/cms/content-entries/${contentModel.modelId}`);
                showSnackbar(error.message);
            }
        }
    });

    const getRevisions = useQuery(GET_REVISIONS, {
        variables: { id: entryId },
        skip: !entryId
    });

    const getLoading = useCallback(() => getEntry.loading || getRevisions.loading, [
        getEntry.loading,
        getRevisions.loading
    ]);

    const entry = get(getEntry, "data.content.data") || {};
    const revisions = get(getRevisions, "data.revisions.data") || {};

    return (
        <DetailsContainer>
            <test-id data-testid="cms-content-details">
                {renderPlugins("cms-content-details", {
                    setLoading,
                    getLoading,
                    entry,
                    revisions,
                    refetchContent: getEntry.refetch,
                    contentModel,
                    state,
                    setState
                })}
            </test-id>
        </DetailsContainer>
    );
};

export default ContentDetails;
