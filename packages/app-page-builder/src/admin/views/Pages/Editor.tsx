import React, { useMemo, useState } from "react";
import { useApolloClient, useMutation } from "@apollo/react-hooks";
import { useHistory, useParams } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import get from "lodash/get";
import { Editor as PbEditor } from "~/admin/components/Editor";
import { createElement } from "~/editor/helpers";
import { GET_PAGE, CREATE_PAGE_FROM } from "./graphql";
import { EditorLoadingScreen } from "~/admin/components/EditorLoadingScreen";
import { LIST_PAGE_ELEMENTS } from "~/admin/graphql/pages";
import createElementPlugin from "~/admin/utils/createElementPlugin";
import createBlockPlugin from "~/admin/utils/createBlockPlugin";

const extractPageGetPage = (data: any): any => {
    return data.pageBuilder?.getPage || {};
};

const extractPageData = (data: any): any => {
    const getPageData = extractPageGetPage(data);
    return getPageData.data;
};

const extractPageErrorData = (data: any): any => {
    const getPageData = extractPageGetPage(data);
    return getPageData.error || {};
};

const Editor: React.FunctionComponent = () => {
    const client = useApolloClient();
    const params = useParams<{ id: string }>();
    const history = useHistory();
    const { showSnackbar } = useSnackbar();
    const [{ page, revisions }, setData] = useState({ page: null, revisions: null });
    const [createPageFrom] = useMutation(CREATE_PAGE_FROM);

    const LoadData = useMemo(() => {
        const savedElements = client.query({ query: LIST_PAGE_ELEMENTS }).then(({ data }) => {
            const elements = get(data, "pageBuilder.listPageElements.data") || [];
            elements.forEach(el => {
                if (el.type === "element") {
                    createElementPlugin(el);
                } else {
                    createBlockPlugin(el);
                }
            });
        });

        const pageData = client
            .query({
                query: GET_PAGE,
                variables: { id: decodeURIComponent(params.id) },
                fetchPolicy: "network-only"
            })
            .then(async ({ data }) => {
                const errorData = extractPageErrorData(data);
                const error = errorData.message;
                if (error) {
                    history.push(`/page-builder/pages`);
                    showSnackbar(error);
                    return;
                }

                const { revisions = [], content, ...restOfPageData } = extractPageData(data);
                const page = {
                    ...restOfPageData,
                    content: content || createElement("document")
                };

                if (page.status === "draft") {
                    setData({ page, revisions });
                } else {
                    const response = await createPageFrom({
                        variables: { from: page.id }
                    });

                    history.push(
                        `/page-builder/editor/${encodeURIComponent(
                            response.data.pageBuilder.createPage.data.id
                        )}`
                    );
                    setTimeout(() => showSnackbar("New revision created."), 1500);
                }
            });

        return React.lazy(() =>
            Promise.all([savedElements, pageData]).then(() => {
                return { default: ({ children }) => children };
            })
        );
    }, []);

    return (
        <React.Suspense fallback={<EditorLoadingScreen />}>
            <LoadData>
                <PbEditor page={page} revisions={revisions} />
            </LoadData>
        </React.Suspense>
    );
};

export default Editor;
