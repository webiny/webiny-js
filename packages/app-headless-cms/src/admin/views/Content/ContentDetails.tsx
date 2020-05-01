import React, { useMemo } from "react";
import useReactRouter from "use-react-router";
import styled from "@emotion/styled";
import { renderPlugins } from "@webiny/app/plugins";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { get } from "lodash";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { createReadQuery } from "@webiny/app-headless-cms/admin/components/ContentModelForm/graphql";

const DetailsContainer = styled("div")({
    height: "calc(100% - 10px)",
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
const ContentDetails = ({ contentModel, dataList }) => {
    const { history, location } = useReactRouter();
    const { showSnackbar } = useSnackbar();

    const query = new URLSearchParams(location.search);
    const contentId = query.get("id");

    const READ_QUERY = useMemo(() => createReadQuery(contentModel), [contentModel.id]);

    const { data, loading } = useQuery(READ_QUERY, {
        variables: { id: contentId },
        skip: !contentId,
        onCompleted: data => {
            const error = get(data, `content.error.message`);
            if (error) {
                query.delete("id");
                history.push({ search: query.toString() });
                showSnackbar(error);
            }
        }
    });

    const content = get(data, "content.data") || {};

    return (
        <DetailsContainer>
            <test-id data-testid="cms-content-details">
                {renderPlugins("cms-content-details", {
                    dataList,
                    content,
                    contentModel,
                    loading
                })}
            </test-id>
        </DetailsContainer>
    );
};

export default ContentDetails;
