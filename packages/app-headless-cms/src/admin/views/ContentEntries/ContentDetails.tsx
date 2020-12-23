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
    const [loading, setLoading] = useState(false);

    const query = new URLSearchParams(location.search);
    const contentId = query.get("id");
    
    const { READ_CONTENT } = useMemo(() => {
        return {
            READ_CONTENT: GQL.createReadQuery(contentModel)
        };
    }, [contentModel.modelId]);

    const { data, loading: readQueryLoading, refetch } = useQuery(READ_CONTENT, {
        variables: { id: contentId },
        skip: !contentId,
        onCompleted: data => {
            console.log(data);
            if (!data) {
                return;
            }

            const { error } = data.content;
            if (error) {
                query.delete("id");
                history.push({ search: query.toString() });
                showSnackbar(error.message);
            }
        }
    });

    const getLoading = useCallback(() => readQueryLoading || loading, [loading, readQueryLoading]);

    const entry = get(data, "content.data") || {};

    return (
        <DetailsContainer>
            <test-id data-testid="cms-content-details">
                {renderPlugins("cms-content-details", {
                    setLoading,
                    getLoading,
                    entry,
                    refetchContent: refetch,
                    contentModel,
                    state,
                    setState
                })}
            </test-id>
        </DetailsContainer>
    );
};

export default ContentDetails;
