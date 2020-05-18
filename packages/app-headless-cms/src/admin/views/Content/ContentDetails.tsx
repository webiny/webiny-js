import React, { useCallback, useMemo, useState } from "react";
import useReactRouter from "use-react-router";
import styled from "@emotion/styled";
import { renderPlugins } from "@webiny/app/plugins";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { get } from "lodash";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { createReadQuery, createListRevisionsQuery } from "@webiny/app-headless-cms/admin/components/ContentModelForm/graphql";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

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

    const i18n = useI18N();
    const [locale, setLocale] = useState(i18n.getLocale().id);
    const [loading, setLoading] = useState(false);

    const query = new URLSearchParams(location.search);
    const contentId = query.get("id");

    const { READ_CONTENT, LIST_REVISIONS } = useMemo(() => {
        return {
            READ_CONTENT: createReadQuery(contentModel),
            LIST_REVISIONS: createListRevisionsQuery(contentModel)
        };
    }, [contentModel.modelId]);

    const { data, loading: readQueryLoading } = useQuery(READ_CONTENT, {
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

    const getLocale = useCallback(() => locale, [locale]);
    const getLoading = useCallback(() => readQueryLoading || loading, [loading, readQueryLoading]);

    const content = get(data, "content.data") || {};

    const contentParent = get(content, "meta.parent");
    const revisionsList = useQuery(LIST_REVISIONS, {
        skip: !contentParent,
        variables: { id: contentParent }
    });

    return (
        <DetailsContainer>
            <test-id data-testid="cms-content-details">
                {renderPlugins("cms-content-details", {
                    getLocale,
                    setLocale,
                    setLoading,
                    getLoading,
                    dataList,
                    content,
                    contentModel,
                    revisionsList
                })}
            </test-id>
        </DetailsContainer>
    );
};

export default ContentDetails;
