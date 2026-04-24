import type { GqlResponse } from "../utils";
import { createGqlQuery } from "../utils";

const PUBLISH_PAGE = /* GraphQL */ `
    mutation PbPublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data {
                    id
                }
            }
        }
    }
`;

export const pbPublishPage = createGqlQuery<GqlResponse<{ id: string }>, { id: string }>(
    PUBLISH_PAGE
);

declare global {
    namespace Cypress {
        interface Chainable {
            pbPublishPage: typeof pbPublishPage;
        }
    }
}

Cypress.Commands.add("pbPublishPage", pbPublishPage);
