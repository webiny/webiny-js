import React, { useMemo, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { plugins } from "@webiny/plugins";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import get from "lodash/get";
import { Editor as PbEditor } from "~/admin/components/Editor";
import { createElement, addElementId } from "~/editor/helpers";
import {
    GET_PAGE_TEMPLATE,
    GetPageTemplateQueryResponse,
    GetPageTemplateQueryVariables
} from "./graphql";
import { EditorLoadingScreen } from "~/admin/components/EditorLoadingScreen";
import {
    LIST_PAGE_ELEMENTS,
    ListPageElementsQueryResponse,
    ListPageElementsQueryResponseData
} from "~/admin/graphql/pages";
import { ListPageBlocksQueryResponse } from "~/admin/views/PageBlocks/graphql";
import { LIST_BLOCK_CATEGORIES } from "~/admin/views/BlockCategories/graphql";
import createElementPlugin from "~/admin/utils/createElementPlugin";
import { PbErrorResponse, PbBlockCategory, PbEditorElement, PbPageTemplate } from "~/types";
import createBlockCategoryPlugin from "~/admin/utils/createBlockCategoryPlugin";
import { PageTemplateWithContent } from "~/templateEditor/state";
import { createStateInitializer } from "./createStateInitializer";
import { DefaultEditorConfig } from "~/editor/defaultConfig/DefaultEditorConfig";
import { DefaultTemplateEditorConfig } from "./config/DefaultTemplateEditorConfig";
import elementVariableRendererPlugins from "~/blockEditor/plugins/elementVariables";
import { usePageBlocks } from "~/admin/contexts/AdminPageBuilder/PageBlocks/usePageBlocks";

const getBlocksWithUniqueElementIds = (blocks: PbEditorElement[]): PbEditorElement[] => {
    return blocks?.map((block: PbEditorElement) => {
        if (block.data?.blockId) {
            return addElementId(block);
        } else {
            return block;
        }
    });
};

export const TemplateEditor = () => {
    plugins.register(elementVariableRendererPlugins());
    const client = useApolloClient();
    const { history, params } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { listBlocks } = usePageBlocks();
    const [template, setTemplate] = useState<PageTemplateWithContent>();

    const templateId = decodeURIComponent(params["id"]);

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
                    }
                });
            });

        const savedBLocks = listBlocks();

        const blockCategories = client
            .query<ListPageBlocksQueryResponse>({ query: LIST_BLOCK_CATEGORIES })
            .then(({ data }) => {
                const blockCategoriesData: PbBlockCategory[] =
                    get(data, "pageBuilder.listBlockCategories.data") || [];
                blockCategoriesData.forEach(element => {
                    createBlockCategoryPlugin({
                        ...element
                    });
                });
            });

        const templateData = client
            .query<GetPageTemplateQueryResponse, GetPageTemplateQueryVariables>({
                query: GET_PAGE_TEMPLATE,
                variables: {
                    id: templateId
                },
                fetchPolicy: "network-only"
            })
            .then(({ data }) => {
                const errorData = get(
                    data,
                    "pageBuilder.getPageTemplate.error"
                ) as unknown as PbErrorResponse;
                const error = errorData?.message;

                if (error) {
                    history.push(`/page-builder/page-templates`);
                    showSnackbar(error);
                    return;
                }

                const pageTemplateData = get(
                    data,
                    "pageBuilder.getPageTemplate.data"
                ) as unknown as PbPageTemplate;

                const { content, ...restOfTemplateData } = pageTemplateData;

                const existingContent = content
                    ? { ...content, elements: getBlocksWithUniqueElementIds(content.elements) }
                    : null;

                setTemplate({
                    ...restOfTemplateData,
                    content: existingContent || createElement("document")
                });
            });

        return React.lazy(() =>
            Promise.all([savedElements, savedBLocks, blockCategories, templateData]).then(() => {
                return { default: ({ children }: { children: React.ReactElement }) => children };
            })
        );
    }, [templateId]);

    return (
        <React.Suspense fallback={<EditorLoadingScreen />}>
            <DefaultEditorConfig />
            <DefaultTemplateEditorConfig />
            <LoadData>
                <PbEditor
                    stateInitializerFactory={createStateInitializer(
                        template as PageTemplateWithContent
                    )}
                />
            </LoadData>
        </React.Suspense>
    );
};
