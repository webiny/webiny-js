// TODO remove
// @ts-nocheck
import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "@webiny/react-router";
import styled from "@emotion/styled";
import { renderPlugins } from "@webiny/app/plugins";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { get } from "lodash";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import {
    createReadQuery,
    createListRevisionsQuery
} from "@webiny/app-headless-cms/admin/components/ContentModelForm/graphql";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

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
const ContentDetails = ({ contentModel, dataList }) => {
    const { history, location } = useRouter();
    const { showSnackbar } = useSnackbar();
    const [state, setState] = useState({});

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

    const { data, loading: readQueryLoading, refetch: readQueryRefetch } = useQuery(READ_CONTENT, {
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
    const refetchContent = useCallback(async () => {
        setLoading(true);
        await readQueryRefetch();
        setLoading(false);
    }, [readQueryRefetch]);

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
                    refetchContent,
                    contentModel,
                    revisionsList,
                    state,
                    setState
                })}
            </test-id>
        </DetailsContainer>
    );
};

export default ContentDetails;
