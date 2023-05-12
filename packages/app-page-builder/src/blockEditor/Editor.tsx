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
import createElementPlugin from "~/admin/utils/createElementPlugin";
import { createStateInitializer } from "./createStateInitializer";
import { BlockEditorConfig } from "./config/BlockEditorConfig";
import { BlockWithContent } from "~/blockEditor/state";
import { createElement, addElementId } from "~/editor/helpers";
import { PbPageBlock, PbEditorElement } from "~/types";
import elementVariablePlugins from "~/blockEditor/plugins/elementVariables";

export const BlockEditor: React.FC = () => {
    plugins.register(elementVariablePlugins());
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

        const blockData = client
            .query<ListPageBlocksQueryResponse>({
                query: GET_PAGE_BLOCK,
                variables: { id: blockId }
            })
            .then(({ data }) => {
                const pageBlockData = get(
                    data,
                    "pageBuilder.getPageBlock.data"
                ) as unknown as PbPageBlock;

                // We need to wrap all elements into a "document" element, it's a requirement for the editor to work.
                const content: PbEditorElement = {
                    ...createElement("document"),
                    elements: [addElementId(pageBlockData.content)]
                };

                setBlock({
                    ...pageBlockData,
                    content
                });
            });

        return React.lazy(() =>
            Promise.all([savedElements, blockData]).then(() => {
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
