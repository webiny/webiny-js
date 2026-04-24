import type { GqlResponse } from "../utils";
import { createGqlQuery } from "../utils";

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
    namespace Cypress {
        interface Chainable {
            pbDeletePage: typeof pbDeletePage;
        }
    }
}

Cypress.Commands.add("pbDeletePage", pbDeletePage);
