import { createGqlQuery, GqlResponse } from "../utils";

const UPDATE_PAGE = /* GraphQL */ `
    mutation updatePage($id: ID!, $data: PbUpdatePageInput!) {
        pageBuilder {
            updatePage(id: $id, data: $data) {
                data {
                    id
                    title
                }
            }
        }
    }
`;

export const pbUpdatePage = createGqlQuery<
    GqlResponse<{ id: string; title: string }>,
    { id: string; data: object }
>(UPDATE_PAGE);

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbUpdatePage: typeof pbUpdatePage;
        }
    }
}

Cypress.Commands.add("pbUpdatePage", pbUpdatePage);
