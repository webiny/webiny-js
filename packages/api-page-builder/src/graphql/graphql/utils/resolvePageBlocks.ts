import { Page, PbContext } from "~/types";

const resolvePageBlocks = async (page: Page, context: PbContext) => {
    const blocks = [];

    for (const pageBlock of page.content?.elements) {
        const blockId = pageBlock.data?.blockId;
        // If block has blockId, then it is reference block and we need to get elements for it
        if (blockId) {
            const blockData = await context.pageBuilder.getPageBlock(blockId);
            // We check if block has variable values set on the page and use them in priority over ones,
            // that are set in blockEditor
            const blockDataVariables = blockData?.content?.data?.variables || [];
            const variables = blockDataVariables.map((blockDataVariable: any) => {
                const value =
                    pageBlock.data?.variables?.find(
                        (variable: any) => variable.id === blockDataVariable.id
                    )?.value || blockDataVariable.value;

                return {
                    ...blockDataVariable,
                    value
                };
            });

            blocks.push({
                ...pageBlock,
                data: {
                    blockId,
                    ...blockData?.content?.data,
                    variables
                },
                elements: blockData?.content?.elements || []
            });
        } else {
            blocks.push(pageBlock);
        }
    }

    return blocks;
};

export default resolvePageBlocks;
