import { gqlClient } from "../utils";

interface CreateCategoryAndBlocksParams {
    blockCategory: Record<string, any>;
    blockNames: string[];
    block?: Block;
}

type Block = {
    type: string;
    text: string;
};

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbCreateCategoryAndBlocks(
                params: CreateCategoryAndBlocksParams
            ): Promise<Array<Record<string, any>>>;
        }
    }
}

const createHeadingBlock = (blockText: string) => {
    return {
        text: {
            desktop: {
                type: "heading",
                alignment: "left",
                tag: "h1"
            },
            data: {
                text: `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"${blockText}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"heading-element","version":1,"tag":"h1","styles":[{"styleId":"heading1","type":"typography"}]}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}`
            }
        },
        settings: {
            margin: {
                desktop: {
                    all: "0px"
                }
            },
            padding: {
                desktop: {
                    all: "0px"
                }
            }
        }
    };
};

const blockData = (blockText: string, blockType: string) => {
    switch (blockType) {
        case "heading":
            return {
                type: "heading",
                data: createHeadingBlock(blockText)
            };
    }
};

const CREATE_BLOCK_CATEGORY_MUTATION = /* GraphQL */ `
    mutation CreateBlockCategory($data: PbBlockCategoryInput!) {
        pageBuilder {
            blockCategory: createBlockCategory(data: $data) {
                data {
                    slug
                    name
                    icon
                    description
                    createdOn
                    createdBy {
                        id
                        displayName
                    }
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

const CRATE_BLOCK_MUTATION = /* GraphQL */ `
    mutation CreatePageBlock($data: PbCreatePageBlockInput!) {
        pageBuilder {
            pageBlock: createPageBlock(data: $data) {
                data {
                    id
                    blockCategory
                    name
                    content
                    createdOn
                    createdBy {
                        id
                        displayName
                        type
                    }
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

Cypress.Commands.add("pbCreateCategoryAndBlocks", ({ blockCategory, blockNames, block }) => {
    cy.login().then(user => {
        const createCategoryPromise = gqlClient
            .request({
                query: CREATE_BLOCK_CATEGORY_MUTATION,
                variables: { data: blockCategory },
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.blockCategory.data);

        return createCategoryPromise.then(categoryData => {
            const categorySlug = categoryData.slug;

            const createBlocksPromises: Array<Promise<{ id: string; name: string }>> = [];
            blockNames.forEach(blockName => {
                createBlocksPromises.push(
                    gqlClient.request({
                        query: CRATE_BLOCK_MUTATION,
                        variables: {
                            data: {
                                name: blockName,
                                blockCategory: categorySlug,
                                content: {
                                    id: "xyz",
                                    type: "block",
                                    data: {},
                                    elements: block ? [blockData(block.text, block.type)] : []
                                }
                            }
                        },
                        authToken: user.idToken.jwtToken
                    })
                );
            });

            return Promise.all(createBlocksPromises);
        });
    });
});
