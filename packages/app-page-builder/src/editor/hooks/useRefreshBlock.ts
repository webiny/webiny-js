import get from "lodash/get";
import { useApolloClient } from "@apollo/react-hooks";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { GET_PAGE_BLOCK } from "~/admin/views/PageBlocks/graphql";
import { ListPageBlocksQueryResponse } from "~/admin/views/PageBlocks/graphql";
import { addElementId } from "~/editor/helpers";
import { PbPageBlock, PbEditorElement } from "~/types";
import { useCallback } from "react";

export const useRefreshBlock = (block: PbEditorElement) => {
    const updateElement = useUpdateElement();
    const client = useApolloClient();

    return useCallback(async () => {
        if (!block?.id) {
            return;
        }

        await client
            .query<ListPageBlocksQueryResponse>({
                query: GET_PAGE_BLOCK,
                variables: { id: block.data.blockId },
                fetchPolicy: "network-only"
            })
            .then(({ data }) => {
                const pageBlockData = get(
                    data,
                    "pageBuilder.getPageBlock.data"
                ) as unknown as PbPageBlock;

                const blockDataVariables = pageBlockData?.content?.data?.variables || [];
                const variables = blockDataVariables.map((blockDataVariable: any) => {
                    const value =
                        block.data?.variables?.find(
                            (variable: any) => variable.id === blockDataVariable.id
                        )?.value || blockDataVariable.value;

                    return {
                        ...blockDataVariable,
                        value
                    };
                });

                updateElement({
                    ...addElementId(pageBlockData.content),
                    id: block.id,
                    data: {
                        ...block?.data,
                        ...pageBlockData?.content?.data,
                        variables
                    }
                });
            });
    }, [block, client, updateElement]);
};
