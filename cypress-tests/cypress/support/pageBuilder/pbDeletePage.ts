import { createGqlQuery, GqlResponse } from "../utils";

const DELETE_PAGE = /* GraphQL */ `
    mutation DeletePage($id: ID!) {
        pageBuilder {
            deletePage(id: $id) {
                error {
                    message
                    data
                    code
                }
            }
        }
    }
`;

export const pbDeletePage = createGqlQuery<GqlResponse<null>, { id: string }>(DELETE_PAGE);

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbDeletePage: typeof pbDeletePage;
        }
    }
}

Cypress.Commands.add("pbDeletePage", pbDeletePage);
