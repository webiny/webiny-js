import React, { useMemo, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useRouter } from "@webiny/react-router";
import { plugins } from "@webiny/plugins";
import get from "lodash/get";
import { Editor as PbEditor } from "~/admin/components/Editor";
import { EditorLoadingScreen } from "~/admin/components/EditorLoadingScreen";
import {
    LIST_PAGE_ELEMENTS,
    ListPageElementsQueryResponse,
    ListPageElementsQueryResponseData
} from "~/admin/graphql/pages";
import { GET_PAGE_BLOCK, ListPageBlocksQueryResponse } from "~/admin/views/PageBlocks/graphql";
import { LIST_BLOCK_CATEGORIES } from "~/admin/views/BlockCategories/graphql";
import createElementPlugin from "~/admin/utils/createElementPlugin";
// import createBlockPlugin from "~/admin/utils/createBlockPlugin";
import { createStateInitializer } from "./createStateInitializer";
import { BlockEditorConfig } from "./config/BlockEditorConfig";
import { BlockWithContent } from "~/blockEditor/state";
import { createBlockElements } from "~/editor/helpers";
import { PbPageBlock, PbEditorBlockPlugin, PbBlockCategory } from "~/types";
import createBlockPlugin from "~/admin/utils/createBlockPlugin";
import createBlockCategoryPlugin from "~/admin/utils/createBlockCategoryPlugin";

export const BlockEditor: React.FC = () => {
    const client = useApolloClient();
    const { params } = useRouter();
    const [block, setBlock] = useState<BlockWithContent>();
    const blockId = decodeURIComponent(params["id"]);

    const LoadData = useMemo(() => {
        // First, load saved page elements, because we can use these to build new blocks.
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

        const blockData = client
            .query<ListPageBlocksQueryResponse>({
                query: GET_PAGE_BLOCK,
                variables: { id: blockId }
            })
            .then(({ data }) => {
                const pageBlockData: PbPageBlock = get(data, "pageBuilder.getPageBlock.data");

                createBlockPlugin(pageBlockData);

                const blockPlugin = plugins.byName<PbEditorBlockPlugin>(
                    `pb-saved-block-${blockId}`
                );
                const blockElement = createBlockElements(blockPlugin?.name as string);

                setBlock({
                    ...pageBlockData,
                    content: blockElement
                });
            });

        return React.lazy(() =>
            Promise.all([savedElements, blockCategories, blockData]).then(() => {
                return { default: ({ children }: { children: React.ReactElement }) => children };
            })
        );
    }, [blockId]);

    return (
        <React.Suspense fallback={<EditorLoadingScreen />}>
            <BlockEditorConfig />
            <LoadData>
                <PbEditor
                    stateInitializerFactory={createStateInitializer(block as BlockWithContent)}
                />
            </LoadData>
        </React.Suspense>
    );
};
