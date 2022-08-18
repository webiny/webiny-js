import React, { useMemo, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useRouter } from "@webiny/react-router";
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
import { createStateInitializer } from "./createStateInitializer";
import { BlockEditorConfig } from "./config/BlockEditorConfig";
import { BlockWithContent, BlockCategoriesAtomType } from "~/blockEditor/state";
import { createElement } from "~/editor/helpers";
import { PbPageBlock, PbBlockCategory, PbEditorElement } from "~/types";

export const BlockEditor: React.FC = () => {
    const client = useApolloClient();
    const { params } = useRouter();
    const [block, setBlock] = useState<BlockWithContent>();
    const [blockCategories, setBlockCategories] = useState<BlockCategoriesAtomType>();
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

                setBlockCategories(blockCategoriesData);
            });

        const blockData = client
            .query<ListPageBlocksQueryResponse>({
                query: GET_PAGE_BLOCK,
                variables: { id: blockId }
            })
            .then(({ data }) => {
                const pageBlockData: PbPageBlock = get(data, "pageBuilder.getPageBlock.data");

                // We need to wrap all elements into a "document" element, it's a requirement for the editor to work.
                const content: PbEditorElement = {
                    ...createElement("document"),
                    elements: [pageBlockData.content]
                };

                setBlock({
                    ...pageBlockData,
                    content
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
                    stateInitializerFactory={createStateInitializer(
                        block as BlockWithContent,
                        blockCategories as BlockCategoriesAtomType
                    )}
                />
            </LoadData>
        </React.Suspense>
    );
};
