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
import createElementPlugin from "~/admin/utils/createElementPlugin";
import createBlockPlugin from "~/admin/utils/createBlockPlugin";
import { createStateInitializer } from "./createStateInitializer";
import { BlockEditorConfig } from "./config/BlockEditorConfig";
import { BlockWithContent } from "~/blockEditor/state";
import { createElement } from "~/editor/helpers";

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
                    } else {
                        createBlockPlugin({
                            ...element
                        });
                    }
                });
            });

        // TODO: for full implementation example, see how `pageEditor` loads the initial data.
        // NOTE: for Blocks, we don't have revisions, so we don't need to check for states like
        // `published`, nor do we need to create new revisions.

        // For demo purposes, we create a dummy promise with dummy data.
        const document = createElement("document");
        const blockData = new Promise<void>(resolve => {
            setBlock({
                id: blockId,
                title: "My block",
                content: {
                    ...document,
                    elements: [createElement("block")]
                },
                createdBy: {
                    id: "123"
                }
            });

            resolve();
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
