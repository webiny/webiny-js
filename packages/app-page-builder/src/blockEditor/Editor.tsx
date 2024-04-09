import React, { useMemo, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { plugins } from "@webiny/plugins";
import { Editor as PbEditor } from "~/admin/components/Editor";
import { EditorLoadingScreen } from "~/admin/components/EditorLoadingScreen";
import {
    LIST_PAGE_ELEMENTS,
    ListPageElementsQueryResponse,
    ListPageElementsQueryResponseData
} from "~/admin/graphql/pages";
import createElementPlugin from "~/admin/utils/createElementPlugin";
import { createStateInitializer } from "./createStateInitializer";
import { BlockWithContent } from "~/blockEditor/state";
import { createElement } from "~/editor/helpers";
import { PbEditorElement } from "~/types";
import elementVariablePlugins from "~/blockEditor/plugins/elementVariables";
import { usePageBlocks } from "~/admin/contexts/AdminPageBuilder/PageBlocks/usePageBlocks";
import { DefaultBlockEditorConfig } from "~/blockEditor/config/DefaultBlockEditorConfig";

export const BlockEditor = () => {
    plugins.register(elementVariablePlugins());
    const client = useApolloClient();
    const { params } = useRouter();
    const [block, setBlock] = useState<BlockWithContent>();
    const blockId = decodeURIComponent(params["id"]);
    const { getBlockById } = usePageBlocks();

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

        const blockData = getBlockById(blockId).then(pageBlock => {
            // We need to wrap all elements into a "document" element, it's a requirement for the editor to work.
            const content: PbEditorElement = {
                ...createElement("document"),
                elements: [pageBlock.content]
            };

            setBlock({
                ...pageBlock,
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
            <DefaultBlockEditorConfig />
            <LoadData>
                {/* PbEditor components is a shell component, which is decorated in `src/PageBuilder.tsx`. */}
                {/* This allows developers to override how the editor component is loaded and mounted. */}
                <PbEditor
                    stateInitializerFactory={createStateInitializer(block as BlockWithContent)}
                />
            </LoadData>
        </React.Suspense>
    );
};
