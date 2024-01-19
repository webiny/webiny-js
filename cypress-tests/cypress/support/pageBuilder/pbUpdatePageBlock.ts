import { createGqlQuery, GqlResponse } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbUpdatePageBlock(id: string, data: any): Promise<any>;
        }
    }
}
const UPDATE_PAGE_BLOCK = /* GraphQL */ `
    mutation UpdatePageBlock($id: ID!, $data: PbUpdatePageBlockInput!) {
        pageBuilder {
            pageBlock: updatePageBlock(id: $id, data: $data) {
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

export const pbUpdatePageBlock = createGqlQuery<GqlResponse<null>, { id: string }>(
    UPDATE_PAGE_BLOCK
);

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbDeletePage: typeof pbUpdatePageBlock;
        }
    }
}

Cypress.Commands.add("pbUpdatePageBlock", pbUpdatePageBlock);
