import React, { useMemo, useState } from "react";
import { useApolloClient, useMutation } from "@apollo/react-hooks";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import get from "lodash/get";
import { Editor as PbEditor } from "~/admin/components/Editor";
import { createElement } from "~/editor/helpers";
import {
    GET_PAGE,
    CREATE_PAGE_FROM,
    CreatePageFromMutationResponse,
    CreatePageFromMutationVariables,
    GetPageQueryResponse,
    GetPageQueryVariables
} from "./graphql";
import { EditorLoadingScreen } from "~/admin/components/EditorLoadingScreen";
import {
    LIST_PAGE_ELEMENTS,
    ListPageElementsQueryResponse,
    ListPageElementsQueryResponseData
} from "~/admin/graphql/pages";
import createElementPlugin from "~/admin/utils/createElementPlugin";
import createBlockPlugin from "~/admin/utils/createBlockPlugin";
import dotProp from "dot-prop-immutable";
import { PbErrorResponse } from "~/types";
import { PageWithContent, RevisionsAtomType } from "~/editor/recoil/modules";

interface PageDataAndRevisionsState {
    page: PageWithContent | null;
    revisions: RevisionsAtomType;
}

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

const Editor: React.FC = () => {
    const client = useApolloClient();
    const { history, params } = useRouter();
    const { showSnackbar } = useSnackbar();
    const [data, setData] = useState<PageDataAndRevisionsState>({
        page: null,
        revisions: []
    });
    const [createPageFrom] = useMutation<
        CreatePageFromMutationResponse,
        CreatePageFromMutationVariables
    >(CREATE_PAGE_FROM);

    const { page, revisions } = data;

    const LoadData = useMemo(() => {
        const savedElements = client
            .query<ListPageElementsQueryResponse>({ query: LIST_PAGE_ELEMENTS })
            .then(({ data }) => {
                const elements: ListPageElementsQueryResponseData[] =
                    get(data, "pageBuilder.listPageElements.data") || [];
                elements.forEach(element => {
                    if (element.type === "element") {
                        createElementPlugin({
                            ...element,
                            data: {},
                            elements: []
                        });
                    } else {
                        createBlockPlugin({
                            ...element
                        });
                    }
                });
            });

        const pageData = client
            .query<GetPageQueryResponse, GetPageQueryVariables>({
                query: GET_PAGE,
                variables: {
                    id: decodeURIComponent(params["id"])
                },
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
                const page: PageWithContent = {
                    ...restOfPageData,
                    content: content || createElement("document")
                };

                if (page.status === "draft") {
                    setData({ page, revisions });
                    return;
                }
                const response = await createPageFrom({
                    variables: { from: page.id }
                });
                const createPageFromError = dotProp.get(
                    response,
                    "data.pageBuilder.createPage.error",
                    null
                ) as PbErrorResponse;
                if (createPageFromError) {
                    showSnackbar(createPageFromError.message);
                    return;
                }
                const id: string | null = dotProp.get(
                    response,
                    "data.pageBuilder.createPage.data.id",
                    null
                );
                if (!id) {
                    showSnackbar("Missing ID in Create Page From Mutation Response.");
                    return;
                }
                history.push(`/page-builder/editor/${encodeURIComponent(id)}`);
                setTimeout(() => showSnackbar("New revision created."), 1500);
            });

        return React.lazy(() =>
            Promise.all([savedElements, pageData]).then(() => {
                return { default: ({ children }: { children: React.ReactElement }) => children };
            })
        );
    }, []);

    return (
        <React.Suspense fallback={<EditorLoadingScreen />}>
            <LoadData>
                <PbEditor page={page as PageWithContent} revisions={revisions} />
            </LoadData>
        </React.Suspense>
    );
};

export default Editor;
